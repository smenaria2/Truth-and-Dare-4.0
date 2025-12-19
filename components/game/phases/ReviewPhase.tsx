
import React, { useState } from 'react';
import { CheckCircle, XCircle, Heart, Sparkles, Loader2, MessageSquareText } from 'lucide-react';
import { Button } from '../../common/Button';
import { TurnRecord, PlayerRole } from '../../../lib/types';
import { cn } from '../../../lib/utils';
import { generateAIReaction } from '../../../lib/gemini';

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
  const [aiReaction, setAiReaction] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiReact = async () => {
    setIsAiLoading(true);
    const reaction = await generateAIReaction(activeTurn.questionText, activeTurn.response || "Sent media", activeTurn.type);
    setAiReaction(reaction);
    setIsAiLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
      <div className={cn("p-4 text-white text-center font-bold uppercase tracking-widest", 
        activeTurn.type === 'truth' ? "bg-blue-500" : "bg-orange-500"
      )}>
        <span>REVIEWING {activeTurn.type}</span>
      </div>
      
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-800 text-center mb-6 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
          "{activeTurn.questionText}"
        </h3>

        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-100 shadow-sm relative">
            <div className="absolute -top-3 left-4 bg-slate-800 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Response</div>
            {activeTurn.response && <p className="text-slate-800 font-medium text-lg text-center py-2">"{activeTurn.response}"</p>}
            {activeTurn.mediaData && (
               <div className="mt-2 rounded-xl overflow-hidden bg-black flex justify-center shadow-lg">
                  {activeTurn.mediaType === 'photo' && <img src={activeTurn.mediaData} className="max-h-64 object-contain" alt="Attached media" />}
                  {activeTurn.mediaType === 'video' && <video src={activeTurn.mediaData} controls className="max-h-64 w-full" aria-label="Attached video" />}
                  {activeTurn.mediaType === 'audio' && <audio src={activeTurn.mediaData} controls className="w-full" aria-label="Attached audio" />}
               </div>
            )}
            {!activeTurn.response && !activeTurn.mediaData && (activeTurn.status === 'failed' ? <p className="text-red-500 font-bold text-center">Timed Out</p> : <p className="text-slate-400 italic text-center">No response content</p>)}
          </div>

          {aiReaction && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl animate-fade-in flex gap-3">
               <div className="bg-amber-100 p-2 rounded-full h-fit"><MessageSquareText size={16} className="text-amber-600" /></div>
               <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">AI Host Says</p>
                  <p className="text-sm font-medium text-amber-900 leading-snug">{aiReaction}</p>
               </div>
            </div>
          )}
          
          {activeTurn.status === 'answered' && (
            canAct && currentTurnRole !== role ? (
              <div className="space-y-4">
                <div className="flex justify-center gap-3">
                    <Button 
                       onClick={() => setIsLovedInReview(!isLovedInReview)}
                       variant="ghost"
                       className={cn("flex items-center gap-2 px-6 py-2 rounded-full border transition-all", 
                          isLovedInReview ? "bg-pink-100 border-pink-300 text-pink-600" : "bg-slate-50 border-slate-200 text-slate-400 hover:text-pink-400"
                       )}
                    >
                       <Heart size={20} fill={isLovedInReview ? "currentColor" : "none"} />
                       <span className="text-sm font-bold">{isLovedInReview ? 'Loved!' : 'Love it?'}</span>
                    </Button>

                    {!aiReaction && (
                       <Button 
                         onClick={handleAiReact}
                         disabled={isAiLoading}
                         variant="ghost"
                         className="flex items-center gap-2 px-6 py-2 rounded-full border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                       >
                         {isAiLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                         <span className="text-sm font-bold">AI React</span>
                       </Button>
                    )}
                </div>
                <div className="flex gap-4">
                  <Button onClick={() => completeTurn(false)} variant="secondary" className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 py-4">
                    <XCircle size={20} /> REJECT
                  </Button>
                  <Button onClick={() => completeTurn(true)} variant="primary" className="flex-1 flex items-center justify-center gap-2 py-4 shadow-lg shadow-romantic-200 font-black">
                    <CheckCircle size={20} /> ACCEPT
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                   <CheckCircle className="text-slate-200" />
                </div>
                <p className="text-sm font-bold text-slate-400">Waiting for partner's review...</p>
              </div>
            )
          )}
          
          {activeTurn.status === 'confirmed' && (
             <div className="text-center text-green-600 font-bold py-4 flex items-center justify-center gap-2 bg-green-50 rounded-xl border border-green-100 animate-fade-in">
                <CheckCircle size={20} /> WELL DONE!
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
