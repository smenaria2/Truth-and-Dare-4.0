

import React from 'react';
import { Play, Users, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';
import { SavedSession } from '../../lib/types';
import { formatTime } from '../../lib/utils'; // Assuming formatTime handles timestamps

interface HomePageProps {
  onSandboxClick: () => void;
  onCreateGameClick: () => void;
  onJoinGameClick: () => void;
  recentSessions: SavedSession[];
  onRejoinSession: (session: SavedSession) => void;
  onClearSessions: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSandboxClick,
  onCreateGameClick,
  onJoinGameClick,
  recentSessions,
  onRejoinSession,
  onClearSessions
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <Button
          onClick={onCreateGameClick}
          variant="primary"
          className="w-full flex items-center justify-center gap-2 py-3 px-6 shadow-lg"
        >
          <Play size={20} /> Create New Game
        </Button>
        <Button
          onClick={onJoinGameClick}
          variant="secondary"
          className="w-full flex items-center justify-center gap-2 py-3 px-6"
        >
          <Users size={20} /> Join Game
        </Button>
      </div>

      {recentSessions.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-sm font-bold text-slate-500 uppercase">Recent Games</h3>
             <button onClick={onClearSessions} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentSessions.map((session, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex justify-between items-center text-left hover:bg-slate-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">{session.myName}</span>
                    <span className="text-xs text-slate-400">vs</span>
                    <span className="font-bold text-slate-700">{session.myRole === 'host' ? session.guestName : session.hostName}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex gap-2">
                    <span className="font-mono bg-slate-200 px-1 rounded text-slate-600">{session.gameCode}</span>
                    <span>• {new Date(session.timestamp).toLocaleDateString()}</span>
                    <span>• {session.scores.host}-{session.scores.guest}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => onRejoinSession(session)} 
                  variant="outline" 
                  size="sm" 
                  className="ml-2 px-3 h-8 border-romantic-200 text-romantic-600 hover:bg-romantic-50"
                  aria-label={`Rejoin game with ${session.myRole === 'host' ? session.guestName : session.hostName}`}
                >
                  <RefreshCw size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};