

import React, { useEffect, useRef, useState } from 'react';
import { Video, Phone, Mic, MicOff, PhoneOff, VideoOff, Minimize2, Maximize2, Move } from 'lucide-react';
import { cn } from '../lib/utils';
import { CallStatus } from '../lib/types';
import { Button } from './common/Button';
import { Loader } from './common/Loader';

interface VideoCallOverlayProps {
  callStatus: CallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoStopped: boolean;
  role: 'host' | 'guest';
  guestName: string;
  hostName: string;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: (notify: boolean) => void;
  onRejectCall: () => void;
  onAcceptCall: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({
  callStatus,
  localStream,
  remoteStream,
  isMuted,
  isVideoStopped,
  role,
  guestName,
  hostName,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  onRejectCall,
  onAcceptCall,
  isMinimized,
  onToggleMinimize
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isExpanded, setIsExpanded] = useState(false); // Local state for size (small vs large)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callStatus, isVideoStopped, isMinimized]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus, isMinimized]);

  if (callStatus === 'idle') return null;

  // Incoming Call Modal (Stays centered modal)
  if (callStatus === 'ringing') {
    return (
      <div 
        className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="incoming-call-title"
      >
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
          <div className="w-24 h-24 bg-romantic-100 rounded-full mx-auto flex items-center justify-center mb-6 animate-pulse">
            <Video size={48} className="text-romantic-600" />
          </div>
          <h3 id="incoming-call-title" className="text-2xl font-bold text-slate-900 mb-1">Incoming Call...</h3>
          <p className="text-slate-500 mb-8">{role === 'host' ? guestName : hostName} wants to video chat</p>
          
          <div className="flex gap-4">
            <Button onClick={onRejectCall} variant="ghost" className="flex-1 flex flex-col items-center gap-2 group p-0" aria-label="Decline call">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <PhoneOff size={24} />
              </div>
              <span className="text-xs font-bold text-slate-500 group-hover:text-red-500 transition-colors">Decline</span>
            </Button>
            <Button onClick={onAcceptCall} variant="ghost" className="flex-1 flex flex-col items-center gap-2 group p-0" aria-label="Accept call">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors">
                <Phone size={24} />
              </div>
              <span className="text-xs font-bold text-slate-500 group-hover:text-green-500 transition-colors">Accept</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active Call UI (Windowed)
  // If minimized, we render hidden video elements to keep stream active
  if (isMinimized) {
    return (
      <div className="hidden">
         {/* Keep elements mounted for audio */}
         <video ref={remoteVideoRef} autoPlay playsInline />
         <video ref={localVideoRef} autoPlay playsInline muted />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "fixed z-50 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 transition-all duration-300 ease-in-out flex flex-col",
        isExpanded ? "inset-4" : "top-20 right-4 w-48 h-72 sm:w-64 sm:h-80"
      )}
      role="region" 
      aria-label="Video Call Window"
    >
      {/* Remote Video (Main) */}
      <div className="flex-1 relative overflow-hidden bg-slate-900">
        {callStatus === 'offering' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 space-y-2 p-4 text-center">
            <div className="w-12 h-12 bg-romantic-600 rounded-full flex items-center justify-center animate-pulse">
              <Phone size={24} className="text-white" />
            </div>
            <p className="text-white font-bold text-xs">Calling...</p>
          </div>
        ) : (
          <>
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" aria-label="Remote video feed" />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader color="white" size="sm" />
              </div>
            )}
          </>
        )}
        
        {/* Overlay Controls (Top) */}
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <Button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm"
            aria-label={isExpanded ? "Shrink window" : "Expand window"}
          >
             {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </Button>
          <Button 
            onClick={onToggleMinimize} 
            className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm"
            aria-label="Minimize to button"
          >
             <span className="text-[10px] font-bold px-1">_</span>
          </Button>
        </div>
      </div>
      
      {/* Local Video (PIP) */}
      <div className={cn(
        "absolute bg-slate-800 rounded-lg overflow-hidden border border-white shadow-lg transition-all",
        isExpanded ? "bottom-24 right-4 w-32 h-44" : "bottom-16 right-2 w-16 h-24"
      )}>
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          className={cn("w-full h-full object-cover transform scale-x-[-1]", isVideoStopped && "hidden")} 
          aria-label="Local video feed"
        />
        {isVideoStopped && (
          <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900">
            <VideoOff size={16} />
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-900/90 backdrop-blur p-3 flex justify-evenly items-center gap-2">
         {/* Audio Only / Video Toggle */}
         <Button 
          onClick={onToggleVideo} 
          className={cn("p-2 rounded-full transition-colors", !isVideoStopped ? "bg-white/10 text-white" : "bg-red-500/20 text-red-500")}
          aria-label={isVideoStopped ? "Start Video" : "Stop Video (Audio Only)"}
          title={isVideoStopped ? "Start Video" : "Switch to Audio Only"}
        >
          {isVideoStopped ? <VideoOff size={18} /> : <Video size={18} />}
        </Button>
        
        <Button 
          onClick={onToggleMute} 
          className={cn("p-2 rounded-full transition-colors", !isMuted ? "bg-white/10 text-white" : "bg-red-500/20 text-red-500")}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </Button>
        
        <Button 
          onClick={() => onEndCall(true)} 
          variant="danger" 
          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
          aria-label="End call"
        >
          <PhoneOff size={18} />
        </Button>
      </div>
    </div>
  );
};