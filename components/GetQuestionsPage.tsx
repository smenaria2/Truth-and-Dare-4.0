
import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { IntensityLevel } from '../lib/types';
import { QUESTIONS, INTENSITY_LEVELS } from '../lib/constants';
import { Button } from './common/Button';
import { Download, Share2, RefreshCcw, ArrowLeft, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { ToastDisplay } from './common/ToastDisplay';

interface GetQuestionsPageProps {
  onBack: () => void;
}

export const GetQuestionsPage: React.FC<GetQuestionsPageProps> = ({ onBack }) => {
  const [intensity, setIntensity] = useState<IntensityLevel>('friendly');
  const [type, setType] = useState<'truth' | 'dare' | 'both'>('both');
  const [currentQuestion, setCurrentQuestion] = useState<{ text: string; type: 'truth' | 'dare' } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const generateQuestion = () => {
    setIsGenerating(true);
    // Simulate a brief loading effect
    setTimeout(() => {
      let selectedType = type;
      if (type === 'both') {
        selectedType = Math.random() > 0.5 ? 'truth' : 'dare';
      }
      
      const list = QUESTIONS[intensity][selectedType as 'truth' | 'dare'];
      const randomQ = list[Math.floor(Math.random() * list.length)];
      
      setCurrentQuestion({
        text: randomQ,
        type: selectedType as 'truth' | 'dare'
      });
      setIsGenerating(false);
    }, 400);
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      const dataUrl = await toPng(cardRef.current, { 
         cacheBust: true, 
         pixelRatio: 2,
      });
      
      // Convert Data URL to Blob
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
        // Fallback to download
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

  return (
    <div className="space-y-6 animate-fade-in max-w-md mx-auto">
      <ToastDisplay />
      
      {/* Settings Panel */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Intensity</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
             {INTENSITY_LEVELS.map(level => (
               <button
                 key={level.id}
                 onClick={() => setIntensity(level.id)}
                 className={cn(
                   "flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                   intensity === level.id 
                     ? "bg-romantic-100 text-romantic-700 border-romantic-300" 
                     : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                 )}
               >
                 {level.emoji} {level.label}
               </button>
             ))}
          </div>
        </div>

        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type</label>
           <div className="flex bg-slate-200 p-1 rounded-lg">
              {(['truth', 'dare', 'both'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all",
                    type === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {t}
                </button>
              ))}
           </div>
        </div>

        <Button onClick={generateQuestion} disabled={isGenerating} className="w-full py-3" variant="primary">
          {isGenerating ? "Reading the stars..." : "Generate Question"}
        </Button>
      </div>

      {/* Card Display */}
      {currentQuestion && (
        <div className="animate-fade-in flex flex-col items-center gap-4">
          
          {/* THE CARD */}
          <div 
             ref={cardRef}
             className="relative w-full aspect-[3/4] bg-romantic-800 text-white p-6 shadow-2xl rounded-sm overflow-hidden flex flex-col items-center text-center justify-between"
             style={{ 
               backgroundColor: '#9f1239', // Fallback
               backgroundImage: 'radial-gradient(circle at center, #be123c 0%, #881337 100%)'
             }}
          >
             {/* Decorative Border */}
             <div className="absolute inset-3 border-[3px] border-gold-400 rounded-sm pointer-events-none z-10">
                {/* Corner Flourishes */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-gold-400 rounded-tl-xl -mt-[3px] -ml-[3px]"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-gold-400 rounded-tr-xl -mt-[3px] -mr-[3px]"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-gold-400 rounded-bl-xl -mb-[3px] -ml-[3px]"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-gold-400 rounded-br-xl -mb-[3px] -mr-[3px]"></div>
                
                {/* Inner thin line */}
                <div className="absolute inset-1 border border-gold-400/50 rounded-sm"></div>
             </div>

             {/* Header */}
             <div className="z-20 mt-6">
                <h2 className="font-script text-4xl text-gold-400 drop-shadow-md">Truth X Dare</h2>
             </div>

             {/* Content */}
             <div className="z-20 flex-1 flex items-center justify-center px-4">
                <p className="font-serif text-xl sm:text-2xl leading-relaxed text-white drop-shadow-sm">
                  <span className="font-bold text-gold-400 block mb-3 text-2xl uppercase tracking-widest border-b border-gold-400/30 pb-2 w-fit mx-auto">
                    {currentQuestion.type}
                  </span>
                  {currentQuestion.text}
                </p>
             </div>

             {/* Footer */}
             <div className="z-20 mb-4 flex flex-col items-center gap-1 text-gold-400">
                <Heart fill="#fbbf24" size={24} />
                <p className="text-[10px] text-gold-400/80 font-mono mt-1 tracking-wider uppercase">truthxdare.vercel.app</p>
             </div>
             
             {/* Texture Overlay */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
          </div>

          <div className="flex gap-3 w-full">
            <Button onClick={generateQuestion} variant="secondary" className="flex-1" aria-label="New Question">
               <RefreshCcw size={18} className="mr-2" /> New
            </Button>
            <Button onClick={handleShare} variant="primary" className="flex-1 bg-gold-500 hover:bg-gold-600 text-white border-none" aria-label="Share Card">
               {navigator.share ? <Share2 size={18} className="mr-2" /> : <Download size={18} className="mr-2" />} 
               {navigator.share ? "Share" : "Save"}
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
         <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto">
            <ArrowLeft size={14} /> Back to Home
         </button>
      </div>
    </div>
  );
};