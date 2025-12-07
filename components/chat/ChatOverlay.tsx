

import React from 'react';
import { Send, Plus, X, Video, XCircle, HeartHandshake } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { MediaRecorder } from '../MediaRecorder';
import { ChatMessage, MediaType, CallStatus, PlayerRole } from '../../lib/types';
import { cn, formatTime } from '../../lib/utils';

interface ChatOverlayProps {
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  chatMessages: ChatMessage[];
  chatBottomRef: React.RefObject<HTMLDivElement>;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendChat: (text: string, mediaType?: MediaType, mediaData?: string) => void;
  showChatMedia: boolean;
  setShowChatMedia: (show: boolean) => void;
  handleStartCall: () => void;
  callStatus: CallStatus;
  role: PlayerRole;
  triggerPing: () => void; // New prop for ping functionality
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  showChat,
  setShowChat,
  chatMessages,
  chatBottomRef,
  inputMessage,
  setInputMessage,
  sendChat,
  showChatMedia,
  setShowChatMedia,
  handleStartCall,
  callStatus,
  role,
  triggerPing, // Use new prop
}) => {
  if (!showChat) return null;

  return (
    <div 
      className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col animate-slide-in-right"
      role="dialog"
      aria-modal="true"
      aria-label="Chat window"
    >
      <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm">
        <h3 className="font-bold text-slate-800">Chat</h3>
        <div className="flex items-center gap-2">
           <Button 
            onClick={triggerPing} // Ping button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full bg-slate-50 text-slate-600 hover:bg-romantic-50 hover:text-romantic-600 transition-colors"
            aria-label="Send a quick reaction emoji"
          >
            <HeartHandshake size={18} />
          </Button>
           <Button 
            onClick={handleStartCall} 
            disabled={callStatus !== 'idle'} 
            variant="ghost"
            size="sm"
            className={cn("p-2 rounded-full transition-colors", callStatus === 'idle' ? "bg-slate-50 text-slate-600 hover:bg-romantic-50 hover:text-romantic-600" : "bg-romantic-100 text-romantic-500 animate-pulse")}
            aria-label="Start video call"
          >
            <Video size={18} />
          </Button>
          <Button onClick={() => setShowChat(false)} variant="ghost" size="sm" aria-label="Close chat">
            <XCircle size={20} />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
         {chatMessages.map(m => (
           <div key={m.id} className={cn("max-w-[80%] p-3 rounded-2xl text-sm animate-fade-in", m.senderRole === role ? "bg-romantic-600 text-white ml-auto rounded-tr-none" : "bg-slate-200 text-slate-800 mr-auto rounded-tl-none")}>
             {m.mediaData && (
                <div className="mb-2 rounded overflow-hidden">
                   {m.mediaType === 'photo' && <img src={m.mediaData} className="max-h-40 object-contain" alt="Chat media" />}
                   {m.mediaType === 'video' && <video src={m.mediaData} controls className="max-h-40 object-contain" aria-label="Chat video" />}
                   {m.mediaType === 'audio' && <audio src={m.mediaData} controls className="w-full" aria-label="Chat audio" />}
                </div>
             )}
             {m.text && <p>{m.text}</p>}
             <span className="text-[10px] opacity-70 block text-right mt-1">{formatTime(m.timestamp)}</span>
           </div>
         ))}
         <div ref={chatBottomRef} />
      </div>

      <div className="p-4 border-t bg-white">
        {showChatMedia ? (
           <div className="bg-slate-100 p-2 rounded-xl mb-2 animate-fade-in">
             <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-xs font-bold text-slate-500">Attach Media</span>
                <Button onClick={() => setShowChatMedia(false)} variant="ghost" size="sm" className="text-slate-400" aria-label="Cancel media attachment">
                  <X size={16} />
                </Button>
             </div>
             <MediaRecorder onCapture={(type, data) => sendChat("", type, data)} onCancel={() => setShowChatMedia(false)} />
           </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setShowChatMedia(true)} variant="secondary" className="p-2" aria-label="Attach media">
              <Plus size={20} />
            </Button>
            <Input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat(inputMessage)}
              placeholder="Type a message..."
              className="flex-1 rounded-full px-4 py-2"
              aria-label="Message input"
            />
            <Button onClick={() => sendChat(inputMessage)} variant="primary" className="p-2" aria-label="Send message">
              <Send size={18} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};