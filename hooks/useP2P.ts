import { useEffect, useRef, useState, useCallback } from 'react';
import type Peer from 'peerjs';
import type { MediaConnection } from 'peerjs';
import { STUN_SERVERS } from '../lib/constants';
import { P2PMessage } from '../lib/types';

// MQTT Client Type (from the global script)
declare const mqtt: any;

interface UseP2PProps {
  role: 'host' | 'guest';
  gameCode: string;
  playerName: string;
  onMessage: (msg: P2PMessage) => void;
  onIncomingCall?: (call: MediaConnection) => void;
  isTestMode?: boolean;
}

export function useP2P({ role, gameCode, playerName, onMessage, onIncomingCall, isTestMode }: UseP2PProps) {
  const [status, setStatus] = useState<'idle' | 'initializing' | 'connected' | 'error'>('idle');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0); 
  
  const peerRef = useRef<Peer | null>(null);
  const mqttClientRef = useRef<any>(null);
  const mountedRef = useRef(false);
  const onIncomingCallRef = useRef(onIncomingCall);
  const onMessageRef = useRef(onMessage);
  
  // We need to track the partner's Peer ID to make calls
  const remotePeerIdRef = useRef<string | null>(null);
  const myPeerIdRef = useRef<string | null>(null);

  useEffect(() => {
    onIncomingCallRef.current = onIncomingCall;
  }, [onIncomingCall]);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const sendMessage = useCallback((msg: P2PMessage) => {
    if (isTestMode) {
      if (onMessageRef.current) setTimeout(() => onMessageRef.current!(msg), 50);
      return;
    }
    
    if (mqttClientRef.current && mqttClientRef.current.connected) {
      const topic = `tnd4_game_${gameCode.toLowerCase()}`;
      
      // Determine if message should be retained (saved on server)
      // GAME_STATE_SYNC is retained so partners get the latest state immediately upon joining
      const shouldRetain = msg.type === 'GAME_STATE_SYNC';
      
      const payload = JSON.stringify({
        ...msg,
        _senderId: myPeerIdRef.current, // Tag with our ID to ignore own messages
        _timestamp: Date.now()
      });

      mqttClientRef.current.publish(topic, payload, { qos: 1, retain: shouldRetain });
    } else {
      console.warn("MQTT not connected, cannot send message");
    }
  }, [gameCode, isTestMode]);

  const callPeer = useCallback((stream: MediaStream) => {
    if (peerRef.current && remotePeerIdRef.current) {
       console.log("Calling peer:", remotePeerIdRef.current);
       return peerRef.current.call(remotePeerIdRef.current, stream);
    } else {
       console.warn("Cannot call: PeerJS not ready or Remote Peer ID unknown", { 
         peerJs: !!peerRef.current, 
         remoteId: remotePeerIdRef.current 
       });
    }
    return null;
  }, []);

  const retry = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryTrigger(prev => prev + 1);
  }, []);

  // --- Main Effect ---
  useEffect(() => {
    mountedRef.current = true;
    let initTimeout: ReturnType<typeof setTimeout>;

    if (isTestMode) {
      setStatus('connected');
      setConnectionStatus('connected');
      return;
    }

    const initNetwork = async () => {
      setStatus('initializing');
      setConnectionStatus('reconnecting');
      
      const PeerJS = (await import('peerjs')).default;

      // 1. Initialize PeerJS (Strictly for Video/Audio)
      if (peerRef.current) {
        if (!peerRef.current.destroyed) peerRef.current.destroy();
        peerRef.current = null;
      }

      // Generate random ID for PeerJS - we exchange this via MQTT
      const peerId = `tnd-${gameCode}-${Math.random().toString(36).substr(2, 6)}`;
      myPeerIdRef.current = peerId;

      const peer = new PeerJS(peerId, {
        host: '0.peerjs.com',
        port: 443,
        secure: true,
        config: { iceServers: STUN_SERVERS },
        debug: 0, 
      });

      peerRef.current = peer;

      peer.on('open', (id) => {
        console.log(`[PeerJS] Open with ID: ${id}`);
        // Once PeerJS is ready, broadcast our ID via MQTT so partner can call us
        if (mqttClientRef.current?.connected) {
             sendMessage({ type: 'PLAYER_INFO', payload: { name: playerName, role, peerId: id } });
             // Also ask for partner info in case we missed their initial broadcast
             sendMessage({ type: 'REQUEST_PLAYER_INFO', payload: {} });
        }
      });

      peer.on('call', (call) => {
        console.log("[PeerJS] Received incoming call");
        if (onIncomingCallRef.current) onIncomingCallRef.current(call);
      });

      peer.on('error', (err: any) => {
        console.warn('[PeerJS] Error:', err);
      });

      // 2. Initialize MQTT (For Data & State Retention)
      if (mqttClientRef.current) {
        mqttClientRef.current.end();
      }

      const topic = `tnd4_game_${gameCode.toLowerCase()}`;
      
      // Setup Last Will and Testament (LWT)
      // If the client disconnects ungracefully (browser close), the broker will publish this message
      const lwtPayload = JSON.stringify({
        type: 'PARTNER_DISCONNECTED',
        payload: { name: playerName },
        _senderId: peerId,
        _timestamp: Date.now()
      });

      const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
         clientId: peerId,
         clean: true,
         keepalive: 60,
         will: {
            topic: topic,
            payload: lwtPayload,
            qos: 1,
            retain: false
         }
      });

      mqttClientRef.current = client;

      client.on('connect', () => {
        console.log("[MQTT] Connected to broker");
        setStatus('connected');
        setConnectionStatus('connected');
        
        client.subscribe(topic, { qos: 1 }, (err: any) => {
            if (!err) {
                console.log(`[MQTT] Subscribed to ${topic}`);
                // Announce presence 
                sendMessage({ type: 'PLAYER_INFO', payload: { name: playerName, role, peerId } });
                // Robustness: Ask for partner ID explicitly to ensure we can make calls
                sendMessage({ type: 'REQUEST_PLAYER_INFO', payload: {} });
            }
        });
      });

      client.on('message', (topic: string, message: any) => {
        try {
            const data = JSON.parse(message.toString());
            
            // Filter out my own messages
            if (data._senderId === myPeerIdRef.current) return;

            // Handle Peer ID Discovery
            if (data.type === 'PLAYER_INFO') {
                if (data.payload.peerId) {
                    // console.log("[P2P] Discovered Partner Peer ID:", data.payload.peerId);
                    remotePeerIdRef.current = data.payload.peerId;
                }
            }
            
            // Handle Request for Info (Auto-Reply)
            if (data.type === 'REQUEST_PLAYER_INFO') {
                console.log("[P2P] Received ID Request, sending info...");
                sendMessage({ type: 'PLAYER_INFO', payload: { name: playerName, role, peerId: myPeerIdRef.current } });
            }

            if (onMessageRef.current) {
                onMessageRef.current(data);
            }
        } catch (e) {
            console.error("Failed to parse MQTT message", e);
        }
      });

      client.on('reconnect', () => {
         console.log("[MQTT] Reconnecting...");
         setConnectionStatus('reconnecting');
      });

      client.on('error', (err: any) => {
         console.error("[MQTT] Error:", err);
         if (status === 'initializing') {
             setError("Could not connect to game server.");
             setStatus('error');
         }
      });

      client.on('offline', () => {
         setConnectionStatus('disconnected');
      });
    };

    initTimeout = setTimeout(initNetwork, 500);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimeout);
      peerRef.current?.destroy();
      // Explicitly send disconnect message if unmounting cleanly (e.g. Exit button)
      if (mqttClientRef.current && mqttClientRef.current.connected) {
         // We manually publish the disconnect message because LWT only fires on ungraceful disconnect
         const topic = `tnd4_game_${gameCode.toLowerCase()}`;
         const payload = JSON.stringify({
            type: 'PARTNER_DISCONNECTED',
            payload: { name: playerName },
            _senderId: myPeerIdRef.current,
            _timestamp: Date.now()
         });
         mqttClientRef.current.publish(topic, payload);
         mqttClientRef.current.end();
      }
    };
  }, [role, gameCode, playerName, isTestMode, retryTrigger, sendMessage]);

  return { status, connectionStatus, error, sendMessage, callPeer, retry };
}