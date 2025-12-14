
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useP2P } from '../hooks/useP2P';
import { GameState, IntensityLevel, P2PMessage, PlayerRole, TurnRecord, ChatMessage, MediaType, CallStatus, GameMode, SavedSession } from '../lib/types';
import { QUESTIONS, INTENSITY_LEVELS, QUESTIONS_PER_RANDOM_LEVEL, RANDOM_MODE_INTENSITY_ORDER, RANDOM_EMOJIS } from '../lib/constants';
import { formatTime, cn } from '../lib/utils';
import { VideoCallOverlay } from './VideoCallOverlay';
import { Send, Plus, X, ArrowDown, Copy, RefreshCw, WifiOff, Sparkles, Share2, Check, CheckCheck, Eye, EyeOff } from 'lucide-react';
import type { MediaConnection } from 'peerjs';
import { Button } from './common/Button';
import { useToast } from '../hooks/useToast';
import { calculateScoreValue } from '../lib/scoring';
import { GameHeader } from './game/GameHeader';
import { IncomingIntensityRequestModal } from './modals/IncomingIntensityRequestModal';
import { GameSelectionPhase } from './game/phases/GameSelectionPhase';
import { QuestionSelectionPhase } from './game/phases/QuestionSelectionPhase';
import { AnswerPhase } from './game/phases/AnswerPhase';
import { ReviewPhase } from './game/phases/ReviewPhase';
import { FloatingEmoji } from './FloatingEmoji';
import { ToastDisplay } from './common/ToastDisplay';
import { MediaRecorder } from './MediaRecorder';

interface GameRoomProps {
  role: PlayerRole;
  gameCode: string;
  playerName: string;
  intensity: IntensityLevel;
  gameMode: GameMode;
  isTestMode?: boolean;
  onExit: () => void;
}

const TIMER_OPTIONS = [0, 30, 60, 120];

interface FloatingEmojiInstance {
  id: string;
  emoji: string;
  position: { x: number; y: number };
  startTime: number;
}

// Helper to merge and sort timeline
type TimelineItem = 
  | { type: 'chat'; data: ChatMessage }
  | { type: 'turn'; data: TurnRecord }
  | { type: 'system'; id: string; text: string; timestamp: number };

export const GameRoom: React.FC<GameRoomProps> = ({ role, gameCode, playerName, intensity, gameMode, isTestMode, onExit }) => {
  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>(() => {
    if (!isTestMode) {
      try {
        const stored = localStorage.getItem(`tod_game_${gameCode}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Date.now() - parsed.lastUpdated < 24 * 60 * 60 * 1000) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn("Failed to restore game state", e);
      }
    }
    
    return {
      gameCode,
      intensityLevel: intensity,
      gameMode: gameMode,
      currentRandomModeIntensity: gameMode === 'random' ? RANDOM_MODE_INTENSITY_ORDER[0] : intensity,
      questionsAnsweredInCurrentLevel: 0,
      currentTurn: 'guest', 
      phase: 'waiting', 
      turnHistory: [],
      activeTurn: null,
      hostName: role === 'host' ? playerName : 'Waiting...',
      guestName: role === 'guest' ? playerName : 'Waiting...',
      scores: { host: 0, guest: 0 },
      chatMessages: [],
      lastUpdated: Date.now(),
      autoSelectTurn: false,
    };
  });

  // --- UI State ---
  const [inputMessage, setInputMessage] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [systemMessages, setSystemMessages] = useState<{id: string, text: string, timestamp: number}[]>([]);
  
  // Realtime Typing
  const [isRealTimeTypingEnabled, setIsRealTimeTypingEnabled] = useState(true);
  const [partnerTypingText, setPartnerTypingText] = useState('');

  // Game Action States
  const [answerText, setAnswerText] = useState('');
  const [draftQuestion, setDraftQuestion] = useState('');
  const [selectedTimer, setSelectedTimer] = useState<number>(0);
  const [isCustomQuestion, setIsCustomQuestion] = useState(false);
  const [showAnswerMedia, setShowAnswerMedia] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLovedInReview, setIsLovedInReview] = useState(false);
  
  // Visuals
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiInstance[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  // Intensity Change State
  const [showIntensitySelector, setShowIntensitySelector] = useState(false);
  const [pendingIntensityRequest, setPendingIntensityRequest] = useState<{ level: IntensityLevel, requester: string } | null>(null);
  
  // --- Call State ---
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoStopped, setIsVideoStopped] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);

  const currentCallRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // P2P Refs
  const sendMessageRef = useRef< (msg: P2PMessage) => void >(() => {});
  const callPeerRef = useRef< (stream: MediaStream) => MediaConnection | null >(() => null);
  const retryRef = useRef< () => void >(() => {});

  const { addToast } = useToast();

  // --- Initial System Message ---
  useEffect(() => {
    if (systemMessages.length === 0) {
      setSystemMessages([{
        id: 'init',
        text: `Game Started. Share Code: ${gameCode}`,
        timestamp: Date.now()
      }]);
    }
  }, []);

  // --- Persistence Effect for Game State ---
  useEffect(() => {
    if (isTestMode) return;
    const stateToSave = { ...gameState, lastUpdated: Date.now() };
    localStorage.setItem(`tod_game_${gameCode}`, JSON.stringify(stateToSave));
  }, [gameState, gameCode, isTestMode]);

  // --- Persistence Effect for Session History (Home Screen) ---
  useEffect(() => {
    if (isTestMode) return;
    if (gameState.hostName === 'Waiting...' && gameState.guestName === 'Waiting...') return;
    
    const session: SavedSession = {
      gameCode: gameState.gameCode,
      hostName: gameState.hostName,
      guestName: gameState.guestName,
      myRole: role,
      myName: playerName,
      scores: gameState.scores,
      timestamp: Date.now(),
      intensity: gameState.intensityLevel,
      gameMode: gameState.gameMode
    };

    try {
      const history = JSON.parse(localStorage.getItem('tod_sessions') || '[]');
      // Remove existing entry for this gameCode to update it
      const filtered = history.filter((s: SavedSession) => s.gameCode !== gameCode);
      // Add updated at top
      localStorage.setItem('tod_sessions', JSON.stringify([session, ...filtered].slice(0, 10)));
    } catch (e) {
      console.error("Failed to save session history", e);
    }
  }, [gameState.hostName, gameState.guestName, gameState.scores, gameState.intensityLevel, role, playerName, gameCode, gameState.gameMode, isTestMode]);


  // --- Helpers ---
  const isMyTurn = gameState.currentTurn === role;
  const currentActiveIntensity = gameState.gameMode === 'random' ? gameState.currentRandomModeIntensity : gameState.intensityLevel;
  
  let canAct = !!isTestMode;
  if (!isTestMode) {
    if (!gameState.activeTurn) {
        canAct = isMyTurn;
    } else {
        switch (gameState.activeTurn.status) {
            case 'selecting': canAct = !isMyTurn; break;
            case 'pending': canAct = isMyTurn; break;
            case 'answered': canAct = !isMyTurn; break;
            default: canAct = false;
        }
    }
  }

  // --- Browser Notification Helper ---
  const sendSystemNotification = useCallback((title: string, body?: string) => {
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { 
          body, 
          icon: 'https://cdn-icons-png.flaticon.com/512/2504/2504929.png',
          tag: 'tnd-notification'
        });
      } catch (e) {
        console.warn("Notification failed", e);
      }
    }
  }, []);

  // --- Callbacks and P2P ---
  const broadcastState = useCallback((newState: GameState) => {
    setGameState(newState);
    if (!isTestMode) {
      // GAME_STATE_SYNC is retained by the MQTT broker, ensuring persistence
      sendMessageRef.current({ type: 'GAME_STATE_SYNC', payload: newState });
    }
  }, [isTestMode]);

  const addSystemMessage = (text: string) => {
    setSystemMessages(prev => [...prev, { id: Math.random().toString(36), text, timestamp: Date.now() }]);
  };

  const handleEndCall = useCallback((notify = true) => {
    if (notify && !isTestMode) sendMessageRef.current({ type: 'CALL_END', payload: {} });
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setIsMuted(false);
    setIsVideoStopped(false);
    setIsCallMinimized(false);
    
    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }
  }, [isTestMode]);

  const handleIncomingStream = useCallback((call: MediaConnection) => {
    console.log("Receive Incoming Stream (PeerJS)");
    currentCallRef.current = call;
    // We set ringing here as well to be robust if MQTT is delayed
    setCallStatus('ringing'); 
    call.on('stream', (remote) => {
      console.log("Remote Stream Received");
      setRemoteStream(remote);
      setCallStatus('connected');
    });
    call.on('close', () => {
      console.log("Call Closed by Peer");
      handleEndCall(false);
    });
    call.on('error', (err) => {
      console.error("Call Error", err);
      handleEndCall(false);
      addToast({ title: 'Connection Error', message: 'Video connection failed.', type: 'error' });
    });
  }, [handleEndCall, addToast]);

  const triggerFloatingEmoji = useCallback((emoji: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const x = Math.random() * 80 + 10;
    setFloatingEmojis(prev => [...prev, { id, emoji, position: { x: window.innerWidth * (x/100), y: window.innerHeight - 100 }, startTime: Date.now() }]);
    setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 4000);
  }, []);

  const handleP2PMessage = useCallback((msg: P2PMessage) => {
    switch (msg.type) {
      case 'GAME_STATE_SYNC':
        // Only update if the received state is newer or different
        const newState = msg.payload as GameState;
        
        // Notify for new Turn (Partner asks me)
        if (newState.activeTurn?.status === 'pending' && newState.activeTurn.playerRole !== role) {
            // Check if this is a fresh state change for us
            if (gameState.activeTurn?.id !== newState.activeTurn.id || gameState.activeTurn?.status !== 'pending') {
                 sendSystemNotification(`New ${newState.activeTurn.type === 'truth' ? 'Truth' : 'Dare'}`, newState.activeTurn.questionText || "Partner sent a question");
            }
        }
        
        // Notify for Answer (Partner answered my question)
        if (newState.activeTurn?.status === 'answered' && newState.activeTurn.playerRole === role) {
             if (gameState.activeTurn?.status !== 'answered') {
                 sendSystemNotification('Partner Answered', newState.activeTurn.response || 'Partner sent a media response');
             }
        }
        
        setGameState(msg.payload);
        break;
      case 'PLAYER_INFO':
        // With MQTT, both parties announce. We update names if needed.
        if (role === 'host' && (gameState.guestName === 'Waiting...' || gameState.guestName !== msg.payload.name)) {
            const newState = { ...gameState, guestName: msg.payload.name, phase: 'playing' as const };
            broadcastState(newState); 
            addSystemMessage(`${msg.payload.name} joined!`);
        } else if (role === 'guest' && gameState.hostName === 'Waiting...' && msg.payload.role === 'host') {
             setGameState(prev => ({ ...prev, hostName: msg.payload.name }));
        }
        break;
      case 'PARTNER_DISCONNECTED':
        addToast({ title: 'Partner Disconnected', message: 'Connection lost. Waiting for them to rejoin...', type: 'error' });
        handleEndCall(false);
        break;
      case 'CHAT_MESSAGE':
        setGameState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, msg.payload] }));
        if (!isUserAtBottom) {
           addToast({ title: 'New Message', message: `${msg.payload.senderName} sent a message`, type: 'info' });
        }
        sendSystemNotification(`Message from ${msg.payload.senderName}`, msg.payload.text || 'Sent an attachment');
        break;
      case 'REALTIME_TYPING':
         setPartnerTypingText(msg.payload.text || '');
         break;
      case 'READ_RECEIPT':
         setGameState(prev => ({
           ...prev,
           chatMessages: prev.chatMessages.map(m => m.id === msg.payload.messageId ? { ...m, read: true } : m)
         }));
         break;
      case 'PING_EMOJI':
         triggerFloatingEmoji(msg.payload.emoji);
         sendSystemNotification('Partner Pinged You', msg.payload.emoji);
         break;
      case 'CALL_OFFER': 
         // Redundant if PeerJS works perfectly, but good backup to show UI state
         setCallStatus('ringing'); 
         sendSystemNotification('Incoming Call', 'Partner is calling you...');
         break;
      case 'CALL_ACCEPT': setCallStatus('connected'); break;
      case 'CALL_REJECT': setCallStatus('idle'); addToast({ title: 'Call Declined', message: 'Partner is busy.', type: 'error' }); break;
      case 'CALL_END': handleEndCall(false); break;
      case 'CALL_WINDOW_STATE': setIsCallMinimized(msg.payload.minimized); break;
      case 'INTENSITY_REQUEST': 
        setPendingIntensityRequest({ level: msg.payload.level, requester: role === 'host' ? gameState.guestName : gameState.hostName }); 
        sendSystemNotification('Request', `${role === 'host' ? gameState.guestName : gameState.hostName} wants to change intensity.`);
        break;
      case 'INTENSITY_RESPONSE':
        if (msg.payload.accepted && msg.payload.level) {
           addToast({ title: 'Intensity Changed', message: `Level changed to ${msg.payload.level}`, type: 'success' });
           addSystemMessage(`Intensity changed to ${msg.payload.level}`);
           if (role === 'host') {
             const newState = { ...gameState, intensityLevel: msg.payload.level };
             broadcastState(newState);
           }
        } else {
           addToast({ title: 'Request Denied', message: 'Partner declined intensity change.', type: 'error' });
        }
        break;
      case 'TOGGLE_AUTO_SELECT':
         setGameState(prev => ({ ...prev, autoSelectTurn: msg.payload.enabled }));
         addToast({ 
             title: msg.payload.enabled ? 'Auto-Select Enabled' : 'Auto-Select Disabled', 
             message: msg.payload.enabled ? 'Turns will be picked automatically!' : 'Manual selection enabled', 
             type: 'info' 
         });
         break;
    }
  }, [gameState, role, addToast, handleEndCall, broadcastState, isUserAtBottom, triggerFloatingEmoji, isTestMode, sendSystemNotification]);

  const { status: p2pStatus, connectionStatus, error: p2pError, sendMessage, callPeer, retry } = useP2P({
    role, gameCode, playerName, onMessage: handleP2PMessage, onIncomingCall: handleIncomingStream, isTestMode
  });

  useEffect(() => {
    sendMessageRef.current = sendMessage;
    callPeerRef.current = callPeer;
    retryRef.current = retry;
  }, [sendMessage, callPeer, retry]);

  // --- Auto-Select Logic ---
  const startTurn = useCallback((type: 'truth' | 'dare') => {
    const newTurn: TurnRecord = {
      id: Math.random().toString(36).substr(2, 9),
      playerRole: role,
      questionText: '',
      type,
      status: 'selecting',
      timestamp: Date.now()
    };
    broadcastState({ ...gameState, activeTurn: newTurn, phase: 'playing' });
  }, [broadcastState, gameState, role]);

  useEffect(() => {
    // Only run if it's my turn, there is no active turn, and auto-select is enabled
    if (!gameState.activeTurn && gameState.currentTurn === role && gameState.autoSelectTurn && !isTestMode) {
       const timer = setTimeout(() => {
           const type = Math.random() > 0.5 ? 'truth' : 'dare';
           startTurn(type);
       }, 1500); // 1.5s delay for better UX
       return () => clearTimeout(timer);
    }
  }, [gameState.activeTurn, gameState.currentTurn, gameState.autoSelectTurn, role, startTurn, isTestMode]);

  const toggleAutoSelect = () => {
    const newVal = !gameState.autoSelectTurn;
    setGameState(prev => ({ ...prev, autoSelectTurn: newVal }));
    if (!isTestMode) {
       sendMessageRef.current({ type: 'TOGGLE_AUTO_SELECT', payload: { enabled: newVal } });
    }
    addToast({ 
         title: newVal ? 'Auto-Select Enabled' : 'Auto-Select Disabled', 
         message: newVal ? 'Turns will be picked automatically!' : 'Manual selection enabled', 
         type: 'info' 
    });
  };

  // --- Read Receipt on Scroll ---
  useEffect(() => {
    if (isUserAtBottom && !isTestMode) {
       const lastMsg = gameState.chatMessages[gameState.chatMessages.length - 1];
       if (lastMsg && lastMsg.senderRole !== role) {
           sendMessageRef.current({ type: 'READ_RECEIPT', payload: { messageId: lastMsg.id } });
       }
    }
  }, [isUserAtBottom, gameState.chatMessages, role, isTestMode]);

  // --- Timer Logic ---
  useEffect(() => {
    if (gameState.activeTurn?.status === 'pending' && gameState.activeTurn.timeLimit && gameState.activeTurn.startedAt) {
      const deadline = gameState.activeTurn.startedAt + (gameState.activeTurn.timeLimit * 1000);
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          if (canAct) failTurn();
        }
      }, 1000);
      timerRef.current = interval;
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [gameState.activeTurn, canAct]);

  // --- Auto Scroll ---
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setIsUserAtBottom(true);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [gameState.chatMessages.length, gameState.turnHistory.length, systemMessages.length, partnerTypingText]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setIsUserAtBottom(scrollHeight - scrollTop - clientHeight < 50);
    }
  };
  
  // --- Input Handling ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputMessage(val);
      if (isRealTimeTypingEnabled && !isTestMode) {
          sendMessageRef.current({ type: 'REALTIME_TYPING', payload: { text: val } });
      }
  };

  // --- Actions ---
  const sendChat = (text: string, mediaType?: MediaType, mediaData?: string) => {
    if (!text && !mediaData) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderRole: role,
      senderName: playerName,
      text, mediaType, mediaData, timestamp: Date.now(),
      read: false
    };
    
    // IMPORTANT: We broadcast the full state (with new message) to retain chat history on the server
    const newState = { ...gameState, chatMessages: [...gameState.chatMessages, msg] };
    setInputMessage('');
    setShowMediaInput(false);
    broadcastState(newState);

    if (!isTestMode && isRealTimeTypingEnabled) {
        sendMessageRef.current({ type: 'REALTIME_TYPING', payload: { text: '' } });
    }
  };

  const sendPing = () => {
    const emoji = RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)];
    triggerFloatingEmoji(emoji);
    if (!isTestMode) sendMessageRef.current({ type: 'PING_EMOJI', payload: { emoji } });
  };

  const sendQuestion = () => {
    if (!gameState.activeTurn) return;
    let qText = draftQuestion;
    if (!isCustomQuestion && !qText) qText = QUESTIONS[currentActiveIntensity][gameState.activeTurn.type][0];
    const updatedTurn: TurnRecord = {
      ...gameState.activeTurn,
      questionText: qText,
      status: 'pending',
      timeLimit: selectedTimer,
      startedAt: Date.now()
    };
    setDraftQuestion('');
    setIsCustomQuestion(false);
    broadcastState({ ...gameState, activeTurn: updatedTurn });
  };

  const submitAnswer = () => {
    if (!gameState.activeTurn) return;
    const updatedTurn: TurnRecord = { ...gameState.activeTurn, response: answerText, status: 'answered', timestamp: Date.now() };
    setAnswerText('');
    setShowAnswerMedia(false);
    broadcastState({ ...gameState, activeTurn: updatedTurn });
  };

  const handleMediaCapture = (type: MediaType, data: string) => {
    if (gameState.activeTurn) {
        setGameState(prev => ({ ...prev, activeTurn: { ...prev.activeTurn!, mediaType: type, mediaData: data } }));
        setShowAnswerMedia(false);
    }
  };

  const completeTurn = (accepted: boolean) => {
    if (!gameState.activeTurn) return;
    if (accepted) {
      const points = calculateScoreValue(gameState.activeTurn.type, gameState.turnHistory, gameState.activeTurn.playerRole);
      let nextLevel = gameState.currentRandomModeIntensity;
      let nextQuestionsCount = gameState.questionsAnsweredInCurrentLevel;
      if (gameState.gameMode === 'random') {
         nextQuestionsCount += 1;
         if (nextQuestionsCount >= QUESTIONS_PER_RANDOM_LEVEL * 2) {
            const currentIndex = RANDOM_MODE_INTENSITY_ORDER.indexOf(gameState.currentRandomModeIntensity);
            if (currentIndex < RANDOM_MODE_INTENSITY_ORDER.length - 1) {
                nextLevel = RANDOM_MODE_INTENSITY_ORDER[currentIndex + 1];
                nextQuestionsCount = 0;
                addSystemMessage(`Level Up! Intensity increased to ${nextLevel}`);
            }
         }
      }
      const completedTurn: TurnRecord = { ...gameState.activeTurn, status: 'confirmed', loved: isLovedInReview };
      const newState: GameState = {
        ...gameState,
        turnHistory: [completedTurn, ...gameState.turnHistory],
        activeTurn: null,
        currentTurn: gameState.currentTurn === 'host' ? 'guest' : 'host',
        scores: { ...gameState.scores, [completedTurn.playerRole]: gameState.scores[completedTurn.playerRole] + points },
        currentRandomModeIntensity: nextLevel,
        questionsAnsweredInCurrentLevel: nextQuestionsCount
      };
      setIsLovedInReview(false);
      broadcastState(newState);
    } else {
      const rejectedTurn: TurnRecord = { ...gameState.activeTurn, status: 'pending', isRetry: true, startedAt: Date.now() };
      broadcastState({ ...gameState, activeTurn: rejectedTurn });
      sendMessageRef.current({ type: 'REJECT_TURN', payload: {} });
    }
  };

  const failTurn = () => {
    if (!gameState.activeTurn) return;
    const failedTurn: TurnRecord = { ...gameState.activeTurn, status: 'failed', timestamp: Date.now() };
    const newState: GameState = {
        ...gameState,
        turnHistory: [failedTurn, ...gameState.turnHistory],
        activeTurn: null,
        currentTurn: gameState.currentTurn === 'host' ? 'guest' : 'host'
    };
    broadcastState(newState);
  };

  // --- Intensity & Calls ---
  const requestIntensityChange = (level: IntensityLevel) => {
    if (role !== 'host') {
      sendMessageRef.current({ type: 'INTENSITY_REQUEST', payload: { level } });
      addToast({ title: 'Request Sent', message: 'Asked host to change intensity', type: 'info' });
    } else {
      const newState = { ...gameState, intensityLevel: level };
      broadcastState(newState);
      setShowIntensitySelector(false);
      addSystemMessage(`Intensity changed to ${level}`);
    }
  };

  const handleIntensityResponse = (accepted: boolean, level?: IntensityLevel) => {
     sendMessageRef.current({ type: 'INTENSITY_RESPONSE', payload: { accepted, level } });
     setPendingIntensityRequest(null);
     if (accepted && level && role === 'host') {
        const newState = { ...gameState, intensityLevel: level };
        broadcastState(newState);
        addSystemMessage(`Intensity changed to ${level}`);
     }
  };

  const handleStartCall = async () => {
    // 1. Get User Media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setCallStatus('offering');
      
      // 2. Attempt Call
      const call = callPeerRef.current(stream);
      
      if (call) {
        currentCallRef.current = call;
        call.on('stream', (remote) => { 
          console.log("Remote Stream Received (Caller)");
          setRemoteStream(remote); 
          setCallStatus('connected'); 
        });
        call.on('close', () => handleEndCall(false));
        call.on('error', (err) => {
            console.error("Call Error (Caller):", err);
            handleEndCall(false);
            addToast({ title: 'Call Failed', message: 'Connection interrupted.', type: 'error' });
        });
        
        // 3. Send Signal via MQTT (Backup/UI Trigger)
        sendMessageRef.current({ type: 'CALL_OFFER', payload: {} });
      } else {
        // Fallback: Retrying logic if Partner ID is just arriving
        addToast({ title: "Connecting...", message: "Establishing video connection...", type: 'info' });
        
        setTimeout(() => {
             const retryCall = callPeerRef.current(stream);
             if(retryCall) {
                currentCallRef.current = retryCall;
                retryCall.on('stream', (remote) => { 
                  setRemoteStream(remote); 
                  setCallStatus('connected'); 
                });
                retryCall.on('close', () => handleEndCall(false));
                retryCall.on('error', (err) => {
                    console.error("Call Error (Retry):", err);
                    handleEndCall(false);
                });
                sendMessageRef.current({ type: 'CALL_OFFER', payload: {} });
             } else {
                addToast({ title: "Call Failed", message: "Partner not reachable. Try again in a moment.", type: 'error' });
                handleEndCall(false);
             }
        }, 2500);
      }
    } catch (err) { addToast({ title: "Error", message: "Could not access camera/mic", type: "error" }); }
  };
  
  const handleAcceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setCallStatus('connected');
      sendMessageRef.current({ type: 'CALL_ACCEPT', payload: {} });
      if (currentCallRef.current) currentCallRef.current.answer(stream);
    } catch (err) { addToast({ title: "Error", message: "Could not access camera/mic", type: "error" }); }
  };

  const handleRejectCall = () => {
    sendMessageRef.current({ type: 'CALL_REJECT', payload: {} });
    setCallStatus('idle');
    if (currentCallRef.current) { currentCallRef.current.close(); currentCallRef.current = null; }
  };

  const handleToggleCallMinimize = () => {
    const newState = !isCallMinimized;
    setIsCallMinimized(newState);
    if (!isTestMode) {
      sendMessageRef.current({ type: 'CALL_WINDOW_STATE', payload: { minimized: newState } });
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?code=${gameCode}`;
    navigator.clipboard.writeText(link);
    addToast({ title: 'Link Copied', message: 'Share this with your partner!', type: 'success' });
  };

  // --- Timeline Construction ---
  const timeline: TimelineItem[] = useMemo(() => {
    const chats = gameState.chatMessages.map(m => ({ type: 'chat' as const, data: m }));
    const turns = gameState.turnHistory.map(t => ({ type: 'turn' as const, data: t }));
    const systems = systemMessages.map(s => ({ type: 'system' as const, id: s.id, text: s.text, timestamp: s.timestamp }));
    return [...chats, ...turns, ...systems].sort((a, b) => {
      const tA = a.type === 'system' ? a.timestamp : a.data.timestamp;
      const tB = b.type === 'system' ? b.timestamp : b.data.timestamp;
      return tA - tB;
    });
  }, [gameState.chatMessages, gameState.turnHistory, systemMessages]);

  const currentLevelInfo = INTENSITY_LEVELS.find(l => l.id === currentActiveIntensity) || INTENSITY_LEVELS[0];

  // Render Timeline Item
  const renderTimelineItem = (item: TimelineItem) => {
    if (item.type === 'system') {
      return (
        <div key={item.id} className="flex justify-center my-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {item.text}
          </span>
        </div>
      );
    }
    if (item.type === 'chat') {
      const isMe = item.data.senderRole === role;
      return (
        <div key={item.data.id} className={cn("flex flex-col max-w-[85%] my-1", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
          <div className={cn("px-4 py-2 rounded-2xl text-sm shadow-sm relative", 
            isMe ? "bg-romantic-500 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none")}>
            {item.data.mediaData && (
              <div className="mb-2 rounded-lg overflow-hidden bg-black/10">
                 {item.data.mediaType === 'photo' && <img src={item.data.mediaData} className="max-h-48" alt="content" />}
                 {item.data.mediaType === 'video' && <video src={item.data.mediaData} controls className="max-h-48" />}
                 {item.data.mediaType === 'audio' && <audio src={item.data.mediaData} controls className="w-full min-w-[200px]" />}
              </div>
            )}
            <p className={cn("mr-4", isMe ? "" : "mr-0")}>{item.data.text}</p>
            
            {/* Read Receipts */}
            {isMe && (
               <div className="absolute bottom-1 right-2">
                  {item.data.read ? (
                     <CheckCheck size={14} className="text-blue-200" />
                  ) : (
                     <Check size={14} className="text-white/60" />
                  )}
               </div>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 px-1">{formatTime(item.data.timestamp)}</span>
        </div>
      );
    }
    if (item.type === 'turn') {
      // Historical Turn Card
      const turn = item.data;
      const isMyTurnRecord = turn.playerRole === role;
      const isFailed = turn.status === 'failed';
      return (
        <div key={turn.id} className="w-full my-2 flex justify-center">
          <div className={cn("w-full max-w-sm rounded-xl overflow-hidden border shadow-sm", 
            turn.type === 'truth' ? "bg-blue-50 border-blue-100" : "bg-orange-50 border-orange-100",
            isFailed && "opacity-70 bg-gray-50 border-gray-200"
          )}>
            <div className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white flex justify-between",
              turn.type === 'truth' ? "bg-blue-400" : "bg-orange-400", isFailed && "bg-gray-400"
            )}>
              <span>{turn.type} • {isMyTurnRecord ? 'You' : (turn.playerRole === 'host' ? gameState.hostName : gameState.guestName)}</span>
              <span>{formatTime(turn.timestamp)}</span>
            </div>
            <div className="p-3">
              <p className="font-bold text-slate-800 text-sm mb-2">{turn.questionText}</p>
              {isFailed ? (
                <div className="text-red-500 text-xs font-bold flex items-center gap-1">🚫 Timed Out</div>
              ) : (
                <div className="bg-white/60 rounded p-2 text-sm text-slate-700">
                  {turn.mediaData ? (
                    <div className="mb-2 rounded-lg overflow-hidden bg-black/10 border border-white">
                       {turn.mediaType === 'photo' && <img src={turn.mediaData} className="max-h-48 w-full object-cover" alt="response" />}
                       {turn.mediaType === 'video' && <video src={turn.mediaData} controls className="max-h-48 w-full bg-black" />}
                       {turn.mediaType === 'audio' && <audio src={turn.mediaData} controls className="w-full mt-2 mb-2 px-2" />}
                    </div>
                  ) : null}
                  {turn.response ? <p>{turn.response}</p> : (!turn.mediaData && <span className="italic opacity-50">No text response</span>)}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden relative">
      <ToastDisplay />
      {floatingEmojis.map(emoji => <FloatingEmoji key={emoji.id} {...emoji} />)}
      
      <IncomingIntensityRequestModal 
         pendingIntensityRequest={pendingIntensityRequest}
         hostName={gameState.hostName}
         guestName={gameState.guestName}
         handleIntensityResponse={handleIntensityResponse}
      />

      <VideoCallOverlay 
        callStatus={callStatus} localStream={localStream} remoteStream={remoteStream}
        isMuted={isMuted} isVideoStopped={isVideoStopped} role={role}
        guestName={gameState.guestName} hostName={gameState.hostName}
        onToggleMute={() => { if(localStreamRef.current) { const t = localStreamRef.current.getAudioTracks()[0]; if(t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }}}}
        onToggleVideo={() => { if(localStreamRef.current) { const t = localStreamRef.current.getVideoTracks()[0]; if(t) { t.enabled = !t.enabled; setIsVideoStopped(!t.enabled); }}}}
        onEndCall={handleEndCall} onRejectCall={handleRejectCall} onAcceptCall={handleAcceptCall}
        isMinimized={isCallMinimized} onToggleMinimize={handleToggleCallMinimize}
      />

      {/* --- HEADER --- */}
      <GameHeader 
        onExit={onExit} gameCode={gameCode} isTestMode={isTestMode}
        currentIntensityEmoji={currentLevelInfo.emoji} currentIntensityLabel={currentLevelInfo.label}
        currentActiveIntensity={currentActiveIntensity} gameMode={gameState.gameMode}
        questionsAnsweredInCurrentLevel={gameState.questionsAnsweredInCurrentLevel}
        questionsPerRandomLevel={QUESTIONS_PER_RANDOM_LEVEL}
        showIntensitySelector={showIntensitySelector} setShowIntensitySelector={setShowIntensitySelector}
        requestIntensityChange={requestIntensityChange}
        scores={gameState.scores} hostName={gameState.hostName} guestName={gameState.guestName}
        role={role} handleStartCall={handleStartCall} callStatus={callStatus}
        connectionStatus={connectionStatus}
        isCallMinimized={isCallMinimized}
        toggleCallMinimize={handleToggleCallMinimize}
        autoSelectTurn={gameState.autoSelectTurn}
        toggleAutoSelect={toggleAutoSelect}
      />

      {/* --- TIMELINE --- */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth"
      >
        <div className="min-h-[20px]"></div> {/* Spacer for top */}
        
        {/* Waiting for Partner Card - Injected at top of stream if waiting */}
        {gameState.guestName === 'Waiting...' && (
          <div className="bg-white p-4 rounded-xl border-2 border-dashed border-romantic-300 mx-auto my-4 max-w-sm flex flex-col items-center gap-3 animate-pulse shadow-sm">
            <div className="text-center">
                <p className="font-bold text-romantic-600">Waiting for Partner...</p>
                <p className="text-xs text-slate-500">Share this code to play!</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                <span className="font-mono font-bold tracking-widest text-lg">{gameCode}</span>
                <Button onClick={() => { navigator.clipboard.writeText(gameCode); addToast({title:'Code Copied', message:'Shared to clipboard', type:'success'}) }} variant="ghost" size="sm" className="h-8 w-8 p-0 text-romantic-500"><Copy size={16}/></Button>
            </div>
             <Button onClick={copyLink} variant="secondary" size="sm" className="w-full text-xs gap-2">
                <Share2 size={14}/> Share Link
             </Button>
          </div>
        )}

        {timeline.map(renderTimelineItem)}
        
        {/* Ghost Typing Bubble */}
        {partnerTypingText && (
          <div className="flex flex-col max-w-[85%] my-1 mr-auto items-start animate-fade-in">
             <div className="px-4 py-2 rounded-2xl text-sm shadow-sm bg-white border border-slate-100 text-slate-500 rounded-tl-none italic opacity-80 flex items-center gap-2">
                <span className="animate-pulse">Typing...</span>
                <span>"{partnerTypingText}"</span>
             </div>
          </div>
        )}
        
        {/* Connection Status Inline */}
        {!isTestMode && (
          <div className="flex flex-col items-center my-4 space-y-2">
            {p2pStatus === 'error' ? (
               <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl text-sm font-bold flex flex-col items-center gap-2 max-w-[90%] text-center shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2">
                    <WifiOff size={16} />
                    <span>Connection Lost</span>
                  </div>
                  <span className="text-xs font-normal opacity-90">{p2pError || "Waiting for retry..."}</span>
                  <Button onClick={retry} size="sm" variant="danger" className="mt-1 h-8 px-4 w-full flex items-center justify-center gap-2">
                    <RefreshCw size={14} /> Retry
                  </Button>
               </div>
            ) : connectionStatus !== 'connected' ? (
               <div className="bg-slate-100 text-slate-500 border border-slate-200 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 shadow-sm animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping"></span>
                  Reconnecting...
               </div>
            ) : null}
          </div>
        )}
      </div>

      {!isUserAtBottom && (
        <button onClick={scrollToBottom} className="absolute bottom-24 right-4 bg-slate-800 text-white p-2 rounded-full shadow-lg z-30 animate-bounce">
          <ArrowDown size={20} />
        </button>
      )}

      {/* --- ACTIVE TURN DOCK & INPUT --- */}
      <div className="bg-white border-t border-slate-100 z-20 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
        
        {/* Active Game Phase "Drawer" */}
        {gameState.activeTurn && (
          <div className="border-b border-slate-100 bg-slate-50/50 max-h-[40vh] overflow-y-auto">
            <div className="p-2">
              {gameState.activeTurn.status === 'selecting' && (
                  <QuestionSelectionPhase 
                    activeTurn={gameState.activeTurn} canAct={canAct} currentTurnRole={gameState.activeTurn.playerRole} role={role}
                    intensityLevel={currentActiveIntensity} draftQuestion={draftQuestion} setDraftQuestion={setDraftQuestion}
                    isCustomQuestion={isCustomQuestion} setIsCustomQuestion={setIsCustomQuestion}
                    selectedTimer={selectedTimer} setSelectedTimer={setSelectedTimer}
                    shuffleQuestion={() => setDraftQuestion(QUESTIONS[currentActiveIntensity][gameState.activeTurn!.type][Math.floor(Math.random() * QUESTIONS[currentActiveIntensity][gameState.activeTurn!.type].length)])}
                    sendQuestion={sendQuestion} isTestMode={isTestMode} timerOptions={TIMER_OPTIONS}
                  />
              )}
              {(gameState.activeTurn.status === 'pending' || gameState.activeTurn.status === 'failed') && (
                  <AnswerPhase 
                      activeTurn={gameState.activeTurn} canAct={canAct} answerText={answerText} setAnswerText={setAnswerText}
                      showMedia={showAnswerMedia} setShowMedia={setShowAnswerMedia} handleMediaCapture={handleMediaCapture}
                      submitAnswer={submitAnswer} timeLeft={timeLeft} failTurn={failTurn} role={role} isTestMode={isTestMode}
                      onSandboxNext={() => { submitAnswer(); setTimeout(() => completeTurn(true), 500); }}
                  />
              )}
              {(gameState.activeTurn.status === 'answered' || gameState.activeTurn.status === 'confirmed' || gameState.activeTurn.status === 'rejected') && (
                  <ReviewPhase 
                      activeTurn={gameState.activeTurn} canAct={canAct} currentTurnRole={gameState.activeTurn.playerRole} role={role}
                      isLovedInReview={isLovedInReview} setIsLovedInReview={setIsLovedInReview} completeTurn={completeTurn} isTestMode={isTestMode}
                  />
              )}
            </div>
          </div>
        )}

        {/* Start Game Prompt (if no active turn) */}
        {!gameState.activeTurn && canAct && (
           <div className="flex justify-center p-2 gap-4 bg-slate-50 border-b border-slate-100">
               <GameSelectionPhase onStartTurn={startTurn} role={role} turnHistory={gameState.turnHistory} />
           </div>
        )}
        
        {!gameState.activeTurn && !canAct && (
          <div className="text-center py-2 text-xs text-slate-400 bg-slate-50 border-b border-slate-100">
             {gameState.autoSelectTurn ? "Selecting turn automatically..." : "Partner's turn to pick..."}
          </div>
        )}

        {/* Media Input Drawer */}
        {showMediaInput && (
          <div className="p-2 bg-slate-100 border-b border-slate-200">
             <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-xs font-bold text-slate-500">Attach Media</span>
                <Button onClick={() => setShowMediaInput(false)} variant="ghost" size="sm" className="h-6 w-6 p-0"><X size={14}/></Button>
             </div>
             <MediaRecorder onCapture={(type, data) => sendChat("", type, data)} onCancel={() => setShowMediaInput(false)} />
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 flex items-end gap-2 bg-white">
          <Button onClick={() => setShowMediaInput(!showMediaInput)} variant="ghost" size="sm" className={cn("p-2 text-slate-400 hover:text-romantic-500", showMediaInput && "text-romantic-500 bg-romantic-50")}>
            <Plus size={24} />
          </Button>
          <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-1 border border-transparent focus-within:border-romantic-300 focus-within:bg-white transition-colors">
            {/* Realtime Typing Toggle */}
            <Button 
                onClick={() => {
                   const newVal = !isRealTimeTypingEnabled;
                   setIsRealTimeTypingEnabled(newVal);
                   if (!newVal && !isTestMode) sendMessageRef.current({ type: 'REALTIME_TYPING', payload: { text: '' } });
                }}
                variant="ghost" 
                size="sm" 
                className="p-1 h-8 w-8 text-slate-400 hover:text-romantic-500"
                aria-label={isRealTimeTypingEnabled ? "Disable real-time typing" : "Enable real-time typing"}
            >
                {isRealTimeTypingEnabled ? <Eye size={16} className="text-romantic-500" /> : <EyeOff size={16} />}
            </Button>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 p-2 text-sm max-h-24 outline-none"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && sendChat(inputMessage)}
            />
          </div>
          {inputMessage.trim() ? (
            <Button onClick={() => sendChat(inputMessage)} variant="primary" size="sm" className="p-3 rounded-full h-10 w-10 flex items-center justify-center">
              <Send size={18} className="ml-0.5" />
            </Button>
          ) : (
            <Button onClick={sendPing} variant="secondary" size="sm" className="p-3 rounded-full h-10 w-10 flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-romantic-100 hover:text-romantic-500">
              <Sparkles size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}