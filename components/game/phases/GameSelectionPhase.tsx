
import React from 'react';
import { Button } from '../../common/Button';
import { PlayerRole, TurnRecord } from '../../../lib/types';
import { calculateScoreValue } from '../../../lib/scoring';
import { Sparkles, Flame, ShieldCheck } from 'lucide-react';

interface GameSelectionPhaseProps {
  onStartTurn: (type: 'truth' | 'dare') => void;
  role: PlayerRole;
  turnHistory: TurnRecord[];
}

export const GameSelectionPhase: React.FC<GameSelectionPhaseProps> = ({ onStartTurn, role, turnHistory }) => {
  const getTruthScore = () => calculateScoreValue('truth', turnHistory, role);
  const getDareScore = () => calculateScoreValue('dare', turnHistory, role);

  return (
    <div className="flex gap-4 w-full max-w-md animate-slide-in-right p-2">
      <Button 
        onClick={() => onStartTurn('truth')}
        className="flex-1 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white shadow-lg transition-all active:scale-95 flex flex-col items-center gap-1 border-b-4 border-blue-700"
        aria-label="Choose Truth"
      >
        <div className="absolute top-1 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
           <ShieldCheck size={48} />
        </div>
        <div className="flex items-center gap-2 z-10">
            <span className="text-2xl" role="img" aria-label="Diamond">💎</span>
            <h3 className="text-lg font-black tracking-tighter">TRUTH</h3>
        </div>
        <span className="text-[10px] font-bold opacity-70 z-10 uppercase tracking-widest">BE HONEST</span>
        <div className="mt-2 bg-white/20 px-3 py-1 rounded-full text-xs font-black z-10 border border-white/10">
          +{getTruthScore()} pts
        </div>
      </Button>
      
      <Button 
        onClick={() => onStartTurn('dare')}
        className="flex-1 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-romantic-500 to-red-600 p-4 text-white shadow-lg transition-all active:scale-95 flex flex-col items-center gap-1 border-b-4 border-romantic-800"
        aria-label="Choose Dare"
      >
         <div className="absolute top-1 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame size={48} />
         </div>
         <div className="flex items-center gap-2 z-10">
            <span className="text-2xl" role="img" aria-label="Fire">🔥</span>
            <h3 className="text-lg font-black tracking-tighter">DARE</h3>
        </div>
        <span className="text-[10px] font-bold opacity-70 z-10 uppercase tracking-widest">BE BOLD</span>
        <div className="mt-2 bg-white/20 px-3 py-1 rounded-full text-xs font-black z-10 border border-white/10">
          +{getDareScore()} pts
        </div>
      </Button>
    </div>
  );
};
