
import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { IntensityLevel } from '../lib/types';
import { QUESTIONS, INTENSITY_LEVELS } from '../lib/constants';
import { Button } from './common/Button';
import { Download, Share2, RefreshCcw, ArrowLeft, Heart, Sparkles, Loader2, Wand2, Hash, History, X, ShieldCheck, Info, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { ToastDisplay } from './common/ToastDisplay';
import { generateAIQuestion } from '../lib/puter';

const VERSION = "4.7.0";
const VERSION_HISTORY = [
  "4.7.0: Implemented seamless AI onboarding with automatic temporary user accounts.",
  "4.6.1: AI Magic now supports multi-language generation based on keywords.",
  "4.6.0: Enhanced question card layout for better visibility and sharing.",
  "4.5.0: Refined AI Privacy notice behavior and card aesthetics.",
  "4.4.0: Improved card aesthetics and added AI Privacy notice.",
  "4.3.0: Switched to Puter.js for AI services.",
  "4.2.2: Enhanced text scaling and fit for generated cards.",
  "4.2.1: Smart scaling for long questions.",
  "4.1.0: P2P multiplayer improvements.",
  "4.0.0: Initial release of Truth X Dare v4."
];

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
  const [showHistory, setShowHistory] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const handleAiToggle = () => {
    if (!isAiMode) {
      setShowPrivacyNotice(true);
    }
    setIsAiMode(!isAiMode);
  };

  const generateQuestion = async () => {
    setIsGenerating(true);
    setShowPrivacyNotice(false); // Hide notice when user proceeds to generate
    
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
      // Small delay to ensure render
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toPng(cardRef.current, { 
         cacheBust: true, 
         pixelRatio: 4, 
         backgroundColor: '#881337',
         style: {
            transform: 'scale(1)',
            borderRadius: '0px'
         }
      });
      
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `txd-${currentQuestion?.type}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Truth X Dare Challenge',
          text: `Check out this ${currentQuestion?.type} challenge!`
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
    if (len > 300) return 'text-[12px] sm:text-[14px] leading-tight';
    if (len > 200) return 'text-[14px] sm:text-[16px] leading-tight';
    if (len > 150) return 'text-[16px] sm:text-[18px] leading-snug';
    if (len > 100) return 'text-[18px] sm:text-[22px] leading-snug';
    if (len > 60) return 'text-[20px] sm:text-[26px] leading-snug';
    if (len > 30) return 'text-[24px] sm:text-[32px] leading-tight';
    return 'text-[28px] sm:text-[38px] leading-tight font-bold';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-md mx-auto">
      <ToastDisplay />
      
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-50">
           <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Customizer</span>
           <button 
             onClick={handleAiToggle}
             className={cn(
               "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black transition-all border",
               isAiMode ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" : "bg-slate-50 border-slate-100 text-slate-400"
             )}
           >
             <Wand2 size={12} className={isAiMode ? "animate-pulse" : ""} />
             {isAiMode ? "AI MODE ON" : "AI MODE OFF"}
           </button>
        </div>

        {showPrivacyNotice && isAiMode && (
          <div className="bg-blue-50/80 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start animate-fade-in">
            <div className="p-1.5 bg-blue-100 rounded-full text-blue-600 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="flex-1">
              <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Privacy Guarantee</h4>
              <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                Puter.js accounts are used only for AI question generation. No other user data, game history, or media is ever sent to any server. Your sessions remain completely private and P2P.
              </p>
              <button onClick={() => setShowPrivacyNotice(false)} className="text-[9px] font-black text-blue-800 underline mt-2 uppercase">Dismiss</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Intensity Level</label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {INTENSITY_LEVELS.map(level => (
               <button
                 key={level.id}
                 onClick={() => setIntensity(level.id)}
                 className={cn(
                   "flex-shrink-0 px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all border flex items-center gap-2",
                   intensity === level.id 
                     ? "bg-romantic-600 text-white border-romantic-700 shadow-lg shadow-romantic-100 scale-105" 
                     : "bg-white text-slate-500 border-slate-200 hover:border-romantic-300"
                 )}
               >
                 <span>{level.emoji}</span>
                 <span>{level.label}</span>
               </button>
             ))}
          </div>
        </div>

        <div className="space-y-3">
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Challenge Type</label>
           <div className="flex gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
              {(['truth', 'dare', 'both'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all",
                    type === t ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {t}
                </button>
              ))}
           </div>
        </div>

        {isAiMode && (
          <div className="animate-fade-in space-y-3 pt-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-[0.15em] ml-1">
              <Hash size={12} /> Keywords
            </label>
            <input 
              type="text"
              placeholder="e.g. funny, deep, spicy"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-4 py-3 text-xs border border-amber-100 rounded-2xl bg-amber-50/20 outline-none text-amber-900 placeholder:text-amber-300 focus:ring-2 focus:ring-amber-200 transition-all"
            />
          </div>
        )}

        <Button 
          onClick={generateQuestion} 
          disabled={isGenerating} 
          className={cn(
            "w-full py-4 relative overflow-hidden transition-all active:scale-[0.98] rounded-2xl border-none font-black uppercase tracking-widest text-sm",
            isAiMode ? "bg-gradient-to-r from-amber-500 via-orange-500 to-romantic-600 text-white shadow-xl shadow-romantic-100" : "bg-slate-900 text-white shadow-xl shadow-slate-100"
          )}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span>Magic in progress...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              {isAiMode ? <Sparkles size={18} /> : <RefreshCcw size={18} />}
              <span>{isAiMode ? "AI Magic" : "Get Question"}</span>
            </div>
          )}
        </Button>
      </div>

      {currentQuestion && (
        <div className="animate-fade-in flex flex-col items-center gap-8 pb-12">
          {/* THE CARD - UPDATED DESIGN */}
          <div 
             ref={cardRef}
             className="relative w-full max-w-[340px] aspect-[3/4.2] text-white shadow-2xl rounded-sm overflow-hidden flex flex-col items-center text-center justify-between"
             style={{ 
               backgroundColor: '#881337',
               backgroundImage: 'radial-gradient(circle at center, #9e1239 0%, #700c2a 100%)',
               padding: '24px 20px' 
             }}
          >
             {/* Ornate Inner Borders */}
             <div className="absolute inset-3 border border-gold-400 opacity-30 rounded-sm pointer-events-none z-10"></div>
             <div className="absolute inset-5 border-[1.5px] border-gold-400 rounded-sm pointer-events-none z-10">
                {/* Corner Decorative Brackets */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-[2.5px] border-l-[2.5px] border-gold-400 -mt-[1.5px] -ml-[1.5px]"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-[2.5px] border-r-[2.5px] border-gold-400 -mt-[1.5px] -mr-[1.5px]"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[2.5px] border-l-[2.5px] border-gold-400 -mb-[1.5px] -ml-[1.5px]"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[2.5px] border-r-[2.5px] border-gold-400 -mb-[1.5px] -mr-[1.5px]"></div>
             </div>

             {/* Small Header */}
             <div className="z-20 mt-1 shrink-0">
                <h2 className="font-script text-[32px] sm:text-[36px] text-gold-400 drop-shadow-md leading-none select-none tracking-wide">Truth X Dare</h2>
             </div>

             {/* Content Body */}
             <div className="z-20 w-full flex-1 flex flex-col items-center justify-center my-2 overflow-hidden min-h-0">
                 {/* TYPE LABEL */}
                 <span className="shrink-0 font-serif font-black text-gold-500 block mb-3 text-[12px] sm:text-[14px] uppercase tracking-[0.4em] border-b border-gold-400/30 pb-2 w-1/2">
                     {currentQuestion.type}
                 </span>
                 
                 {/* THE CHALLENGE TEXT */}
                 <div className="w-full flex items-center justify-center flex-1 min-h-0 px-2">
                     <p className={cn(
                         "font-serif text-white italic drop-shadow-md break-words w-full",
                         getFontSize(currentQuestion.text)
                     )}>
                         "{currentQuestion.text}"
                     </p>
                 </div>
             </div>

             {/* Bottom Footer - URL */}
             <div className="z-20 shrink-0 mb-2 flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2">
                   <div className="h-[0.5px] w-6 bg-gold-400/40"></div>
                   <Heart fill="#fbbf24" size={8} className="text-gold-500 opacity-80" />
                   <div className="h-[0.5px] w-6 bg-gold-400/40"></div>
                </div>
                <p className="text-[10px] sm:text-[11px] text-gold-400/70 font-bold tracking-[0.1em] lowercase font-mono">truthxdare.vercel.app</p>
             </div>
             
             {/* Textures */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-soft-light"></div>
          </div>

          <div className="flex gap-4 w-full px-2 max-w-[340px]">
            <Button onClick={generateQuestion} variant="secondary" className="flex-1 py-4 bg-white border border-slate-200 text-slate-800 shadow-xl rounded-2xl font-bold" aria-label="Generate another">
               <RefreshCcw size={18} className="mr-2" /> Again
            </Button>
            <Button onClick={handleShare} className="flex-1 py-4 bg-gold-600 hover:bg-gold-700 text-white border-none shadow-xl font-black rounded-2xl" aria-label="Share or download">
               {navigator.share ? <Share2 size={18} className="mr-2" /> : <Download size={18} className="mr-2" />} 
               {navigator.share ? "Share" : "Save"}
            </Button>
          </div>
        </div>
      )}

      <div className="text-center pt-2">
         <button onClick={onBack} className="text-[10px] font-black text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 mx-auto transition-colors uppercase tracking-[0.2em]">
            <ArrowLeft size={12} /> BACK TO HOME
         </button>
      </div>

      <footer className="text-center pb-12">
        <button 
          onClick={() => setShowHistory(true)}
          className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-romantic-300 transition-colors"
        >
          v{VERSION} • HISTORY
        </button>
      </footer>

      {showHistory && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative border-t-8 border-romantic-500">
            <button onClick={() => setShowHistory(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
               <X size={20} />
            </button>
            <div className="flex items-center gap-2 text-romantic-600 mb-6">
               <History size={20} />
               <h3 className="font-black uppercase text-sm tracking-widest">Version History</h3>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
               {VERSION_HISTORY.map((h, i) => (
                 <div key={i} className="border-l-2 border-slate-100 pl-4 py-1">
                   <p className="text-xs text-slate-600 font-medium leading-relaxed">
                     {h}
                   </p>
                 </div>
               ))}
            </div>
            <Button onClick={() => setShowHistory(false)} variant="primary" className="w-full mt-8 py-3.5 rounded-2xl">Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};
