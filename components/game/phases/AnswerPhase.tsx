import React from 'react';
import { Timer as TimerIcon, Image as ImageIcon, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../common/Button';
import { MediaRecorder } from '../../MediaRecorder';
import { TutorialTooltip } from '../../TutorialTooltip';
import { TurnRecord, MediaType, PlayerRole } from '../../../lib/types';
import { cn } from '../../../lib/utils';

interface AnswerPhaseProps {
  activeTurn: TurnRecord;
  canAct: boolean;
  answerText: string;
  setAnswerText: (text: string) => void;
  showMedia: boolean;
  setShowMedia: (show: boolean) => void;
  handleMediaCapture: (type: MediaType, data: string) => void;
  submitAnswer: () => void;
  timeLeft: number | null;
  failTurn: () => void; // Passed from GameRoom
  role: PlayerRole; // To check whose turn it is
  isTestMode?: boolean;
  onSandboxNext?: () => void;
}

export const AnswerPhase: React.FC<AnswerPhaseProps> = ({
  activeTurn,
  canAct,
  answerText,
  setAnswerText,
  showMedia,
  setShowMedia,
  handleMediaCapture,
  submitAnswer,
  timeLeft,
  failTurn,
  role,
  isTestMode,
  onSandboxNext
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
      <div className={cn("p-4 text-white text-center font-bold uppercase tracking-widest flex justify-between items-center", 
        activeTurn.type === 'truth' ? "bg-blue-500" : "bg-orange-500"
      )}>
        <span>{activeTurn.type}</span>
        {activeTurn.status === 'pending' && timeLeft !== null && !isTestMode && (
          <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded text-xs font-mono">
            <TimerIcon size={12} aria-hidden="true" />
            <span className={cn(timeLeft < 10 && "text-red-200 animate-pulse font-bold")} aria-live="polite">{timeLeft}s</span>
          </div>
        )}
      </div>
      
      <div className="p-6">
        {activeTurn.isRetry && activeTurn.status === 'pending' && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm text-center font-medium" role="status">
             Partner rejected your previous answer. Try again!
          </div>
        )}

        <h3 className="text-xl font-medium text-slate-800 text-center mb-6 leading-relaxed">
          {activeTurn.questionText}
        </h3>

        {activeTurn.status === 'pending' && canAct && (
          <div className="space-y-4">
            {isTestMode ? (
              <Button 
                onClick={onSandboxNext}
                variant="primary"
                className="w-full flex items-center justify-center gap-2 py-4"
              >
                Next Question <ArrowRight size={20} />
              </Button>
            ) : (
              <TutorialTooltip content="Answer honestly or do the dare!" isVisible={false} position="top" className="w-full block">
                {showMedia ? (
                  <MediaRecorder onCapture={handleMediaCapture} onCancel={() => setShowMedia(false)} />
                ) : (
                  <>
                    {activeTurn.mediaData ? (
                      <div className="relative rounded-lg overflow-hidden bg-black flex items-center justify-center bg-slate-100">
                         {activeTurn.mediaType === 'photo' && <img src={activeTurn.mediaData} className="max-h-64 object-contain" alt="Attached media" />}
                         {activeTurn.mediaType === 'video' && <video src={activeTurn.mediaData} controls className="max-h-64 w-full" aria-label="Attached video" />}
                         {activeTurn.mediaType === 'audio' && <audio src={activeTurn.mediaData} controls className="w-full mt-4 mb-4" aria-label="Attached audio" />}
                         <Button 
                           onClick={() => setShowMedia(false)} 
                           variant="ghost" size="sm" className="absolute top-2 right-2 bg-white/50 hover:bg-white text-slate-700"
                           aria-label="Remove attached media"
                         >
                           <XCircle size={20}/>
                         </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                         <textarea 
                           className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 min-h-[100px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-romantic-500"
                           placeholder={activeTurn.type === 'truth' ? "Type your honest answer..." : "Describe how you completed the dare..."}
                           value={answerText}
                           onChange={(e) => setAnswerText(e.target.value)}
                           aria-label="Your answer input"
                         />
                         <Button onClick={() => setShowMedia(true)} variant="secondary" className="p-3 h-fit" aria-label="Attach media">
                           <ImageIcon />
                         </Button>
                      </div>
                    )}
                    <Button 
                      onClick={submitAnswer}
                      disabled={!answerText && !activeTurn.mediaData}
                      variant="primary"
                      className="w-full"
                    >
                      Submit Response
                    </Button>
                  </>
                )}
              </TutorialTooltip>
            )}
          </div>
        )}

        {activeTurn.status === 'pending' && !canAct && (
          <div className="text-center py-8 text-slate-400 animate-pulse">
            <p>Waiting for response...</p>
          </div>
        )}
        
        {activeTurn.status === 'failed' && (
           <div className="text-center py-4 bg-red-50 rounded-lg border border-red-100 animate-fade-in" role="status">
              <p className="text-red-600 font-bold">⏰ Time's up!</p>
              <p className="text-xs text-red-400">Turn failed.</p>
           </div>
        )}
      </div>
    </div>
  );
};