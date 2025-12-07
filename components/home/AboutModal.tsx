
import React from 'react';
import { Shield, Heart, Wifi, Video, Lock, X, Sparkles, Flame } from 'lucide-react';
import { Button } from '../common/Button';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col border-t-8 border-romantic-500">
        {/* Header */}
        <div className="bg-romantic-50 p-5 border-b border-romantic-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-romantic-700">
            <Flame className="fill-romantic-500 text-romantic-500 animate-pulse" size={24} />
            <h2 className="font-black text-xl tracking-tight">Truth X Dare</h2>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:bg-romantic-100 rounded-full">
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 text-slate-700">
          
          {/* Section 1: The Game */}
          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-3 flex items-center gap-2">
              <Video size={20} className="text-blue-500" />
              What is Truth X Dare?
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              <strong>Truth X Dare</strong> is not just a game; it's a digital intimacy bridge designed for couples. 
              We've reinvented the classic party game by integrating <strong>real-time video calling</strong> directly into the gameplay. 
              Play, talk, and see each other react instantly to every blush, laugh, and daring moment, all within a single app.
            </p>
          </section>

          {/* Section 2: Privacy */}
          <section className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg mb-3 flex items-center gap-2">
              <Shield size={20} className="text-green-600" />
              Privacy-First Architecture
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 mb-4">
              Intimacy requires absolute trust. That is why Truth X Dare is engineered with a <strong>Peer-to-Peer (P2P)</strong> core.
            </p>
            <div className="space-y-3">
              <div className="flex gap-3 items-start p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                <Lock size={18} className="text-romantic-500 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <strong className="block text-slate-800 mb-0.5">Direct Connection</strong> 
                  Your video, audio, and photos travel directly between you and your partner. No central server ever records or stores your media.
                </div>
              </div>
              <div className="flex gap-3 items-start p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                <Wifi size={18} className="text-romantic-500 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <strong className="block text-slate-800 mb-0.5">Ephemeral Data</strong> 
                  Chat history and game progress are temporary. Close the tab, and the session data vanishes forever.
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Utility */}
          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-3 flex items-center gap-2">
              <Heart size={20} className="text-romantic-500" />
              Why Couples Love It
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                  <Video size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Long Distance Savior</h4>
                  <p className="text-xs text-slate-500 mt-1">No more juggling Zoom on one screen and a game on another. We bring connection and play into one seamless experience.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Tailored Intimacy</h4>
                  <p className="text-xs text-slate-500 mt-1">From sweet "Friendly" icebreakers to "Very Hot" desires, our intensity levels help you explore your relationship at your own pace.</p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 text-center">
          <Button onClick={onClose} variant="primary" className="w-full py-3 text-sm shadow-lg shadow-romantic-200">
            Got it, let's play!
          </Button>
        </div>
      </div>
    </div>
  );
};
