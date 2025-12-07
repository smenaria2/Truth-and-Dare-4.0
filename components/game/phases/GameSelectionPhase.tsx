
import React from 'react';
import { Button } from '../../common/Button';
import { PlayerRole, TurnRecord } from '../../../lib/types';
import { calculateScoreValue } from '../../../lib/scoring';

interface GameSelectionPhaseProps {
  onStartTurn: (type: 'truth' | 'dare') => void;
  role: PlayerRole;
  turnHistory: TurnRecord[];
}

export const GameSelectionPhase: React.FC<GameSelectionPhaseProps> = ({ onStartTurn, role, turnHistory }) => {
  const getTruthScore = () => calculateScoreValue('truth', turnHistory, role);
  const getDareScore = () => calculateScoreValue('dare', turnHistory, role);

  return (
    <div className="flex gap-3 w-full max-w-md animate-slide-in-right">
      <Button 
        onClick={() => onStartTurn('truth')}
        className="flex-1 group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-400 to-blue-500 p-3 text-white shadow-md transition-transform active:scale-95 flex items-center justify-between"
        aria-label="Choose Truth"
      >
        <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="Diamond emoji">💎</span>
            <div className="text-left">
                <h3 className="text-sm font-bold leading-none">TRUTH</h3>
                <span className="text-[9px] opacity-80">Honesty pays</span>
            </div>
        </div>
        <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">+{getTruthScore()}</div>
      </Button>
      
      <Button 
        onClick={() => onStartTurn('dare')}
        className="flex-1 group relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 p-3 text-white shadow-md transition-transform active:scale-95 flex items-center justify-between"
        aria-label="Choose Dare"
      >
         <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="Fire emoji">🔥</span>
            <div className="text-left">
                <h3 className="text-sm font-bold leading-none">DARE</h3>
                <span className="text-[9px] opacity-80">Be bold</span>
            </div>
        </div>
        <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">+{getDareScore()}</div>
      </Button>
    </div>
  );
};
