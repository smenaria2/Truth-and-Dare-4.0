import React from 'react';
import { CheckCircle, XCircle, Heart } from 'lucide-react';
import { Button } from '../../common/Button';
import { TutorialTooltip } from '../../TutorialTooltip';
import { TurnRecord, PlayerRole } from '../../../lib/types';
import { cn } from '../../../lib/utils';

interface ReviewPhaseProps {
  activeTurn: TurnRecord;
  canAct: boolean;
  currentTurnRole: PlayerRole;
  role: PlayerRole;
  isLovedInReview: boolean;
  setIsLovedInReview: (loved: boolean) => void;
  completeTurn: (accepted: boolean) => void;
  isTestMode?: boolean;
}

export const ReviewPhase: React.FC<ReviewPhaseProps> = ({
  activeTurn,
  canAct,
  currentTurnRole,
  role,
  isLovedInReview,
  setIsLovedInReview,
  completeTurn,
  isTestMode,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
      <div className={cn("p-4 text-white text-center font-bold uppercase tracking-widest", 
        activeTurn.type === 'truth' ? "bg-blue-500" : "bg-orange-500"
      )}>
        <span>{activeTurn.type}</span>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-medium text-slate-800 text-center mb-6 leading-relaxed">
          {activeTurn.questionText}
        </h3>

        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            {activeTurn.response && <p className="text-slate-700 italic">"{activeTurn.response}"</p>}
            {activeTurn.mediaData && (
               <div className="mt-4 rounded-lg overflow-hidden bg-black flex justify-center">
                  {activeTurn.mediaType === 'photo' && <img src={activeTurn.mediaData} className="max-h-64 object-contain" alt="Attached media" />}
                  {activeTurn.mediaType === 'video' && <video src={activeTurn.mediaData} controls className="max-h-64 w-full" aria-label="Attached video" />}
                  {activeTurn.mediaType === 'audio' && <audio src={activeTurn.mediaData} controls className="w-full" aria-label="Attached audio" />}
               </div>
            )}
            {!activeTurn.response && !activeTurn.mediaData && (activeTurn.status === 'failed' ? "Timeout" : "No response")}
          </div>
          
          {activeTurn.status === 'answered' && (
            canAct && currentTurnRole !== role ? (
              <TutorialTooltip content="Review and rate their answer!" isVisible={!!isTestMode} position="top">
                <div>
                  <div className="flex justify-center mb-4">
                      <Button 
                         onClick={() => setIsLovedInReview(!isLovedInReview)}
                         variant="outline"
                         className={cn("flex items-center gap-2 px-4 py-2 rounded-full border transition-all", 
                            isLovedInReview ? "bg-pink-100 border-pink-300 text-pink-600" : "bg-white border-slate-200 text-slate-400"
                         )}
                         aria-pressed={isLovedInReview}
                         aria-label="Love this answer"
                      >
                         <Heart size={20} fill={isLovedInReview ? "currentColor" : "none"} />
                         <span className="text-sm font-bold">Love this answer</span>
                      </Button>
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => completeTurn(false)} variant="secondary" className="flex-1 flex items-center justify-center gap-2" aria-label="Reject answer">
                      <XCircle size={18} /> Reject
                    </Button>
                    <Button onClick={() => completeTurn(true)} variant="primary" className="flex-1 flex items-center justify-center gap-2" aria-label="Accept answer">
                      <CheckCircle size={18} /> Accept
                    </Button>
                  </div>
                </div>
              </TutorialTooltip>
            ) : (
              <div className="text-center text-slate-400 py-2 animate-pulse">
                {isTestMode ? "Acting as partner to review..." : "Waiting for approval..."}
              </div>
            )
          )}
          
          {activeTurn.status === 'confirmed' && (
             <div className="text-center text-green-600 font-bold py-2 flex items-center justify-center gap-2 animate-fade-in" role="status">
                <CheckCircle size={20} /> Answer Accepted!
             </div>
          )}
          
          {activeTurn.status === 'rejected' && (
             <div className="text-center text-red-500 font-bold py-2 animate-fade-in" role="status">Answer Rejected. Retrying...</div>
          )}
        </div>
      </div>
    </div>
  );
};