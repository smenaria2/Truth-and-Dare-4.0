
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
        qText = await generateAIQuestion(selectedType as 'truth' | 'dare', intensity, keywords);
        if (!qText) throw new Error("AI failed to generate question");
      } else {
        const list = QUESTIONS[intensity][selectedType as 'truth' | 'dare'];
        qText = list[Math.floor(Math.random() * list.length)];
      }
      
      setCurrentQuestion({
        text: qText,
        type: selectedType as 'truth' | 'dare'
      });
    } catch (err) {
      console.error(err);
      addToast({ title: 'AI Error', message: 'Using local backup list.', type: 'error' });
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
      // Ensure the card is rendered at a stable size for high-quality export
      const dataUrl = await toPng(cardRef.current, { 
         cacheBust: true, 
         pixelRatio: 3, // Higher for crisp mobile shared images
         backgroundColor: '#881337',
         style: {
            transform: 'scale(1)',
         }
      });
      
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "truth-x-dare-card.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Truth X Dare Challenge',
          text: `I generated a ${currentQuestion?.type} challenge for us!`
        });
      } else {
        const link = document.createElement('a');
        link.download = `txd-${currentQuestion?.type}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        addToast({ title: 'Downloaded', message: 'Saved to your gallery', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: 'Export Error', message: 'Failed to generate image.', type: 'error' });
    }
  };

  const getFontSize = (text: string) => {
    const len = text.length;
    if (len > 180) return 'text-sm sm:text-base leading-tight';
    if (len > 140) return 'text-base sm:text-lg leading-tight';
    if (len > 100) return 'text-lg sm:text-xl leading-snug';
    if (len > 60) return 'text-xl sm:text-2xl leading-normal';
    return 'text-2xl sm:text-4xl leading-relaxed';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-md mx-auto">
      <ToastDisplay />
      
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
              <Hash size={12} /> Keywords
            </label>
            <input 
              type="text"
              placeholder="e.g. funny, deep, spicy"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-amber-200 rounded-lg bg-amber-50/30 outline-none text-amber-900 placeholder:text-amber-300"
            />
          </div>
        )}

        <Button 
          onClick={generateQuestion} 
          disabled={isGenerating} 
          variant={isAiMode ? "primary" : "secondary"}
          className={cn(
            "w-full py-3.5 relative overflow-hidden transition-all active:scale-[0.98]",
            isAiMode ? "bg-gradient-to-r from-amber-500 to-romantic-600 border-none shadow-md" : "bg-slate-800 text-white border-none"
          )}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span>Generating...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              {isAiMode ? <Sparkles size={18} /> : <RefreshCcw size={18} />}
              <span>{isAiMode ? "AI Magic" : "Random Shuffle"}</span>
            </div>
          )}
        </Button>
      </div>

      {currentQuestion && (
        <div className="animate-fade-in flex flex-col items-center gap-6 pb-10">
          <div 
             ref={cardRef}
             className="relative w-full max-w-[340px] aspect-[3/4] text-white p-6 sm:p-10 shadow-2xl rounded-sm overflow-hidden flex flex-col items-center text-center justify-between"
             style={{ 
               backgroundColor: '#881337',
               backgroundImage: 'radial-gradient(circle at center, #be123c 0%, #881337 100%)'
             }}
          >
             <div className="absolute inset-4 border-[2px] sm:border-[3px] border-gold-400 rounded-sm pointer-events-none z-10">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-gold-400 rounded-tl-xl -mt-[2px] -ml-[2px]"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-gold-400 rounded-tr-xl -mt-[2px] -mr-[2px]"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-gold-400 rounded-bl-xl -mb-[2px] -ml-[2px]"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-gold-400 rounded-br-xl -mb-[2px] -mr-[2px]"></div>
             </div>

             <div className="z-20 mt-4 sm:mt-6">
                <h2 className="font-script text-4xl sm:text-5xl text-gold-400 drop-shadow-sm">Truth X Dare</h2>
             </div>

             <div className="z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-h-[65%] w-full overflow-hidden">
                <span className="font-bold text-gold-400 block mb-3 sm:mb-5 text-sm sm:text-lg uppercase tracking-[0.3em] border-b border-gold-400/40 pb-1 sm:pb-2">
                  {currentQuestion.type}
                </span>
                <div className="flex items-center justify-center w-full flex-1">
                   <p className={cn(
                     "font-serif text-white italic drop-shadow-md break-words w-full",
                     getFontSize(currentQuestion.text)
                   )}>
                     "{currentQuestion.text}"
                   </p>
                </div>
             </div>

             <div className="z-20 mb-4 sm:mb-6 flex flex-col items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-1">
                   <Heart fill="#fbbf24" size={16} className="text-gold-400" />
                </div>
                <p className="text-[8px] sm:text-[10px] text-gold-400/80 font-black tracking-widest uppercase">TRUTHXDARE.APP</p>
             </div>
             
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
          </div>

          <div className="flex gap-4 w-full">
            <Button onClick={generateQuestion} variant="secondary" className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 shadow-sm" aria-label="Shuffle">
               <RefreshCcw size={18} className="mr-2" /> One More
            </Button>
            <Button onClick={handleShare} variant="primary" className="flex-1 py-4 bg-gold-600 hover:bg-gold-700 text-white border-none shadow-md font-black" aria-label="Share">
               {navigator.share ? <Share2 size={18} className="mr-2" /> : <Download size={18} className="mr-2" />} 
               {navigator.share ? "Share" : "Save"}
            </Button>
          </div>
        </div>
      )}

      <div className="text-center pt-2">
         <button onClick={onBack} className="text-[10px] font-black text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 mx-auto transition-colors uppercase tracking-widest">
            <ArrowLeft size={12} /> BACK TO HOME
         </button>
      </div>

      <footer className="text-center pb-8">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">v4.2.1 • Smart Scaling</p>
      </footer>
    </div>
  );
};
