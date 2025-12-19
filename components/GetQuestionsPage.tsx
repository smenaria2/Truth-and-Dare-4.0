
import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { IntensityLevel } from '../lib/types';
import { QUESTIONS, INTENSITY_LEVELS } from '../lib/constants';
import { Button } from './common/Button';
import { Download, Share2, RefreshCcw, ArrowLeft, Heart, Sparkles, Loader2, Wand2, Hash } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { ToastDisplay } from './common/ToastDisplay';
import { generateAIQuestion } from '../lib/gemini';

interface GetQuestionsPageProps {
  onBack: () => void;
}

export const GetQuestionsPage: React.FC<GetQuestionsPageProps> = ({ onBack }) => {
  const [intensity, setIntensity] = useState<IntensityLevel>('friendly');
  const [type, setType] = useState<'truth' | 'dare' | 'both'>('both');
  const [isAiMode, setIsAiMode] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<{ text: string; type: 'truth' | 'dare' } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const generateQuestion = async () => {
    setIsGenerating(true);
    
    try {
      let selectedType = type;
      if (type === 'both') {
        selectedType = Math.random() > 0.5 ? 'truth' : 'dare';
      }

      let qText = "";
      
      if (isAiMode) {
        // AI Generation Path with Keywords
        qText = await generateAIQuestion(selectedType as 'truth' | 'dare', intensity, keywords);
        if (!qText) throw new Error("AI failed to generate question");
      } else {
        // Static List Path
        const list = QUESTIONS[intensity][selectedType as 'truth' | 'dare'];
        qText = list[Math.floor(Math.random() * list.length)];
      }
      
      setCurrentQuestion({
        text: qText,
        type: selectedType as 'truth' | 'dare'
      });
    } catch (err) {
      console.error(err);
      addToast({ title: 'AI Error', message: 'Could not generate AI question. Using local list instead.', type: 'error' });
      // Fallback to static
      let selectedType = type === 'both' ? (Math.random() > 0.5 ? 'truth' : 'dare') : type;
      const list = QUESTIONS[intensity][selectedType as 'truth' | 'dare'];
      setCurrentQuestion({
        text: list[Math.floor(Math.random() * list.length)],
        type: selectedType as 'truth' | 'dare'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      const dataUrl = await toPng(cardRef.current, { 
         cacheBust: true, 
         pixelRatio: 2,
      });
      
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "truth-x-dare-card.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Truth X Dare Question',
          text: 'Check out this question!'
        });
        addToast({ title: 'Shared', message: 'Card shared successfully', type: 'success' });
      } else {
        const link = document.createElement('a');
        link.download = 'truth-x-dare-card.png';
        link.href = dataUrl;
        link.click();
        addToast({ title: 'Downloaded', message: 'Card saved to photos', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', message: 'Could not generate image. Try screenshotting instead.', type: 'error' });
    }
  };

  // Helper to determine font size for the card based on text length
  const getFontSize = (text: string) => {
    if (text.length > 120) return 'text-lg';
    if (text.length > 80) return 'text-xl';
    return 'text-2xl sm:text-3xl';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-md mx-auto">
      <ToastDisplay />
      
      {/* Settings Panel */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-5">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Customizer</span>
           <button 
             onClick={() => setIsAiMode(!isAiMode)}
             className={cn(
               "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all border",
               isAiMode ? "bg-amber-100 border-amber-200 text-amber-600 shadow-sm" : "bg-slate-50 border-slate-100 text-slate-400"
             )}
           >
             <Wand2 size={12} className={isAiMode ? "animate-pulse" : ""} />
             {isAiMode ? "AI MODE ON" : "AI MODE OFF"}
           </button>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-2">Intensity Level</label>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
             {INTENSITY_LEVELS.map(level => (
               <button
                 key={level.id}
                 onClick={() => setIntensity(level.id)}
                 className={cn(
                   "flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap",
                   intensity === level.id 
                     ? "bg-romantic-600 text-white border-romantic-700 shadow-md" 
                     : "bg-slate-50 text-slate-500 border-slate-200 hover:border-romantic-300"
                 )}
               >
                 {level.emoji} {level.label}
               </button>
             ))}
          </div>
        </div>

        <div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-2">Challenge Type</label>
           <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              {(['truth', 'dare', 'both'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "py-1.5 text-[10px] font-black uppercase rounded-lg transition-all",
                    type === t ? "bg-white text-slate-800 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {t}
                </button>
              ))}
           </div>
        </div>

        {isAiMode && (
          <div className="animate-fade-in space-y-2">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-tighter">
              <Hash size={12} /> Add Keywords (Optional)
            </label>
            <input 
              type="text"
              placeholder="e.g. travel, food, future, spicy"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-amber-200 rounded-lg bg-amber-50/30 focus:outline-none focus:ring-1 focus:ring-amber-400 text-amber-900 placeholder:text-amber-300"
            />
          </div>
        )}

        <Button 
          onClick={generateQuestion} 
          disabled={isGenerating} 
          variant={isAiMode ? "primary" : "secondary"}
          className={cn(
            "w-full py-3.5 relative overflow-hidden group transition-all active:scale-[0.98]",
            isAiMode ? "bg-gradient-to-r from-amber-500 to-romantic-600 border-none shadow-romantic-200" : "bg-slate-800 text-white border-none"
          )}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span>{isAiMode ? "Consulting AI..." : "Shuffling..."}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              {isAiMode ? <Sparkles size={18} /> : <RefreshCcw size={18} />}
              <span>{isAiMode ? "Magic AI Generation" : "Generate Random"}</span>
            </div>
          )}
        </Button>
      </div>

      {/* Card Display */}
      {currentQuestion && (
        <div className="animate-fade-in flex flex-col items-center gap-6 pb-10">
          <div 
             ref={cardRef}
             className="relative w-full aspect-[3/4] text-white p-8 shadow-2xl rounded-sm overflow-hidden flex flex-col items-center text-center justify-between"
             style={{ 
               backgroundColor: '#9f1239',
               backgroundImage: 'radial-gradient(circle at center, #be123c 0%, #881337 100%)'
             }}
          >
             <div className="absolute inset-4 border-[3px] border-gold-400 rounded-sm pointer-events-none z-10">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-[4px] border-l-[4px] border-gold-400 rounded-tl-2xl -mt-[4px] -ml-[4px]"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-[4px] border-r-[4px] border-gold-400 rounded-tr-2xl -mt-[4px] -mr-[4px]"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[4px] border-l-[4px] border-gold-400 rounded-bl-2xl -mb-[4px] -ml-[4px]"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[4px] border-r-[4px] border-gold-400 rounded-br-2xl -mb-[4px] -mr-[4px]"></div>
                <div className="absolute inset-1 border border-gold-400/30 rounded-sm"></div>
             </div>

             <div className="z-20 mt-6">
                <h2 className="font-script text-5xl text-gold-400 drop-shadow-md">Truth X Dare</h2>
             </div>

             <div className="z-20 flex-1 flex flex-col items-center justify-center px-6 max-h-[60%] overflow-hidden">
                <span className="font-bold text-gold-400 block mb-5 text-lg uppercase tracking-[0.3em] border-b border-gold-400/40 pb-2">
                  {currentQuestion.type}
                </span>
                <div className="flex items-center justify-center flex-1">
                   <p className={cn(
                     "font-serif leading-tight text-white italic drop-shadow-md",
                     getFontSize(currentQuestion.text)
                   )}>
                     "{currentQuestion.text}"
                   </p>
                </div>
             </div>

             <div className="z-20 mb-6 flex flex-col items-center gap-2">
                <div className="flex items-center gap-1">
                   <Heart fill="#fbbf24" size={20} className="text-gold-400" />
                   {isAiMode && <Sparkles size={16} className="text-gold-400" />}
                </div>
                <p className="text-[10px] text-gold-400/90 font-black tracking-widest uppercase">TRUTHXDARE.APP</p>
             </div>
             
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-15 pointer-events-none mix-blend-overlay"></div>
          </div>

          <div className="flex gap-4 w-full">
            <Button onClick={generateQuestion} variant="secondary" className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm" aria-label="New Question">
               <RefreshCcw size={18} className="mr-2" /> One More
            </Button>
            <Button onClick={handleShare} variant="primary" className="flex-1 py-4 bg-gold-500 hover:bg-gold-600 text-white border-none shadow-gold-100 font-black" aria-label="Share Card">
               {navigator.share ? <Share2 size={18} className="mr-2" /> : <Download size={18} className="mr-2" />} 
               {navigator.share ? "Share Card" : "Save Image"}
            </Button>
          </div>
        </div>
      )}

      <div className="text-center pt-2">
         <button onClick={onBack} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 mx-auto transition-colors">
            <ArrowLeft size={14} /> BACK TO HOME
         </button>
      </div>

      <footer className="text-center pb-8">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">v4.2.0 • AI-Powered Insights</p>
      </footer>
    </div>
  );
};
