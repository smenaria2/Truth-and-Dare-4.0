
import React, { useState } from 'react';
import { Clock, Shuffle, Edit2, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../../common/Button';
import { TutorialTooltip } from '../../TutorialTooltip';
import { TurnRecord, IntensityLevel, PlayerRole } from '../../../lib/types';
import { cn } from '../../../lib/utils';
import { QUESTIONS } from '../../../lib/constants';
import { generateAIQuestion } from '../../../lib/gemini';

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
  const [isAiLoading, setIsAiLoading] = useState(false);
  const placeholderQuestion = QUESTIONS[intensityLevel][activeTurn.type][0] || "Select a question...";
  
  React.useEffect(() => {
    if (!isCustomQuestion && !draftQuestion && activeTurn.questionText === '') {
      shuffleQuestion();
    }
  }, [isCustomQuestion, draftQuestion, activeTurn.questionText, shuffleQuestion]);

  const toggleCustomMode = () => {
    setIsCustomQuestion(!isCustomQuestion);
    if (!isCustomQuestion === false) {
       shuffleQuestion();
    }
  };

  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    const aiQ = await generateAIQuestion(activeTurn.type, intensityLevel);
    if (aiQ) {
      setDraftQuestion(aiQ);
      setIsCustomQuestion(true);
    }
    setIsAiLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
      <div className={cn("p-4 text-white text-center font-bold uppercase tracking-widest", activeTurn.type === 'truth' ? "bg-blue-500" : "bg-orange-500")}>
        {activeTurn.type}
      </div>
      <div className="p-6">
        {canAct ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-slate-500">
              <span className="font-bold text-slate-400 text-[10px] uppercase">Pick a challenge</span>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <select 
                  value={selectedTimer} 
                  onChange={(e) => setSelectedTimer(Number(e.target.value))}
                  className="bg-slate-50 rounded px-2 py-1 text-xs border border-slate-200 outline-none focus:ring-1 focus:ring-romantic-400 font-bold text-slate-600"
                >
                  {timerOptions.map(t => (
                    <option key={t} value={t}>{t === 0 ? 'No Limit' : `${t}s`}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {isCustomQuestion ? (
              <div className="relative group">
                  <textarea 
                  className="w-full p-4 pr-10 rounded-xl border focus:outline-none focus:ring-2 min-h-[120px] text-lg font-medium bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300 focus:ring-romantic-500 transition-all shadow-inner"
                  placeholder="Type your own question..."
                  value={draftQuestion}
                  onChange={(e) => setDraftQuestion(e.target.value)}
                  />
                  {draftQuestion && (
                      <button 
                          onClick={() => setDraftQuestion('')}
                          className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-400 bg-white rounded-lg shadow-sm transition-colors border border-slate-100"
                      >
                          <X size={16} />
                      </button>
                  )}
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200 min-h-[120px] flex items-center justify-center text-center relative overflow-hidden">
                 <p className="text-lg font-bold text-slate-700 leading-tight">{draftQuestion || placeholderQuestion}</p>
                 <div className="absolute top-2 right-2 opacity-10">
                    <Sparkles size={40} className={activeTurn.type === 'truth' ? "text-blue-400" : "text-orange-400"} />
                 </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={shuffleQuestion} variant="secondary" className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 border-none rounded-xl" title="Shuffle Questions">
                 <Shuffle size={20} />
              </Button>
              <Button onClick={handleAiSuggest} disabled={isAiLoading} variant="secondary" className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200 border rounded-xl relative" title="AI Suggestion">
                 {isAiLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                 <span className="absolute -top-1 -right-1 flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                 </span>
              </Button>
              <Button 
                  onClick={toggleCustomMode} 
                  variant="secondary" 
                  className={cn("p-3 transition-colors border rounded-xl", isCustomQuestion ? "bg-romantic-100 text-romantic-600 border-romantic-300" : "bg-slate-100 text-slate-600 border-none")}
                  title="Edit Question"
              >
                 <Edit2 size={20} />
              </Button>
              <Button onClick={sendQuestion} disabled={!draftQuestion.trim()} variant="primary" className="flex-1 shadow-lg shadow-romantic-200 font-black tracking-wide">
                 ASK PARTNER
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center animate-pulse">
               {activeTurn.type === 'truth' ? <Clock className="text-blue-400" /> : <Clock className="text-orange-400" />}
            </div>
            <p className="text-lg font-bold text-slate-600">Waiting for {currentTurnRole}...</p>
            <p className="text-xs text-slate-400 max-w-[200px]">They are picking a juicy {activeTurn.type} for you to answer.</p>
          </div>
        )}
      </div>
    </div>
  );
};
