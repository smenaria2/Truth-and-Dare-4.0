
import React from 'react';
import { Clock, Shuffle, Edit2, X } from 'lucide-react';
import { Button } from '../../common/Button';
import { TutorialTooltip } from '../../TutorialTooltip';
import { TurnRecord, IntensityLevel, PlayerRole } from '../../../lib/types';
import { cn } from '../../../lib/utils';
import { QUESTIONS } from '../../../lib/constants'; // Import QUESTIONS

interface QuestionSelectionPhaseProps {
  activeTurn: TurnRecord;
  canAct: boolean;
  currentTurnRole: PlayerRole;
  role: PlayerRole;
  intensityLevel: IntensityLevel;
  draftQuestion: string;
  setDraftQuestion: (question: string) => void;
  isCustomQuestion: boolean;
  setIsCustomQuestion: (isCustom: boolean) => void;
  selectedTimer: number;
  setSelectedTimer: (timer: number) => void;
  shuffleQuestion: () => void;
  sendQuestion: () => void;
  isTestMode?: boolean;
  timerOptions: number[];
}

export const QuestionSelectionPhase: React.FC<QuestionSelectionPhaseProps> = ({
  activeTurn,
  canAct,
  currentTurnRole,
  role,
  intensityLevel,
  draftQuestion,
  setDraftQuestion,
  isCustomQuestion,
  setIsCustomQuestion,
  selectedTimer,
  setSelectedTimer,
  shuffleQuestion,
  sendQuestion,
  isTestMode,
  timerOptions,
}) => {

  const placeholderQuestion = QUESTIONS[intensityLevel][activeTurn.type][0] || "Select a question...";
  
  // Ensure draftQuestion is initialized if it's empty and not in custom mode
  React.useEffect(() => {
    if (!isCustomQuestion && !draftQuestion && activeTurn.questionText === '') {
      shuffleQuestion(); // Auto-select an initial question
    }
  }, [isCustomQuestion, draftQuestion, activeTurn.questionText, shuffleQuestion]);

  const toggleCustomMode = () => {
    if (isCustomQuestion) {
        // Switch back to random mode
        setIsCustomQuestion(false);
        shuffleQuestion();
    } else {
        // Switch to custom mode (editing current question)
        setIsCustomQuestion(true);
        // draftQuestion already holds the current question text, so we don't clear it.
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
      <div className={cn("p-4 text-white text-center font-bold uppercase tracking-widest", activeTurn.type === 'truth' ? "bg-blue-500" : "bg-orange-500")}>
        {activeTurn.type}
      </div>
      <div className="p-6">
        {canAct ? (
          <TutorialTooltip content="Pick a fun question or write your own!" isVisible={!!isTestMode} position="top" className="w-full block">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-slate-500">
                <span>Select question for partner</span>
                {!isTestMode && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} aria-hidden="true" />
                    <select 
                      value={selectedTimer} 
                      onChange={(e) => setSelectedTimer(Number(e.target.value))}
                      className="bg-slate-100 rounded p-1 text-xs border border-slate-200 outline-none focus:ring-2 focus:ring-romantic-400"
                      aria-label="Select time limit for question"
                    >
                      {timerOptions.map(t => (
                        <option key={t} value={t}>{t === 0 ? 'No Limit' : `${t}s`}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {isCustomQuestion ? (
                <div className="relative">
                    <textarea 
                    className="w-full p-4 pr-10 rounded-xl border focus:outline-none focus:ring-2 min-h-[100px] text-lg font-medium bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-romantic-500"
                    placeholder="Type your own question..."
                    value={draftQuestion}
                    onChange={(e) => setDraftQuestion(e.target.value)}
                    aria-label="Custom question input"
                    />
                    {draftQuestion && (
                        <button 
                            onClick={() => setDraftQuestion('')}
                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                            aria-label="Clear question text"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 min-h-[120px] flex items-center justify-center text-center" aria-live="polite">
                   <p className="text-lg font-medium text-slate-800">{draftQuestion || placeholderQuestion}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={shuffleQuestion} variant="secondary" className="p-3" aria-label="Shuffle question">
                   <Shuffle size={20} />
                </Button>
                <Button 
                    onClick={toggleCustomMode} 
                    variant="secondary" 
                    className={cn("p-3 transition-colors", isCustomQuestion && "bg-romantic-100 text-romantic-600 border-romantic-200")} 
                    aria-label={isCustomQuestion ? "Switch to random question" : "Edit current question"}
                >
                   <Edit2 size={20} />
                </Button>
                <Button onClick={sendQuestion} disabled={!draftQuestion.trim()} variant="primary" className="flex-1">
                   Ask Question
                </Button>
              </div>
            </div>
          </TutorialTooltip>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg text-slate-600 mb-2">You chose <strong>{activeTurn.type}</strong></p>
            <p className="text-slate-400 animate-pulse">
              {isTestMode ? "Acting as partner to select a question..." : "Partner is selecting a question for you..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
