import React, { useState, useEffect } from 'react';
import { generateGameCode } from '../../lib/utils';
import { INTENSITY_LEVELS, RANDOM_MODE_INTENSITY_ORDER } from '../../lib/constants';
import { IntensityLevel, GameMode } from '../../lib/types';
import { Play, Users, Copy, Check, Link, Share2, Dice5, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { cn } from '../../lib/utils';

interface CreateGamePageProps {
  name: string;
  setName: (name: string) => void;
  gameCode: string;
  setGameCode: (code: string) => void;
  intensity: IntensityLevel;
  setIntensity: (level: IntensityLevel) => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  onStartGame: () => void;
  isTestMode: boolean;
}

export const CreateGamePage: React.FC<CreateGamePageProps> = ({
  name,
  setName,
  gameCode,
  setGameCode,
  intensity,
  setIntensity,
  gameMode,
  setGameMode,
  onStartGame,
  isTestMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!gameCode || isTestMode) { // Regenerate code if it's sandbox or empty
      setGameCode(generateGameCode());
    }
  }, [setGameCode, gameCode, isTestMode]);

  const copyCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?code=${gameCode}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?code=${gameCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Truth and Dare',
          text: `Join my game! Code: ${gameCode}`,
          url: url,
        });
        console.log('Shared successfully');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Web Share API is not supported in your browser.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={15}
        aria-label="Your Name"
      />

      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold mb-3 text-slate-700">Game Settings</h3>
        
        {/* Game Mode Selection */}
        <div className="mb-4">
          <label id="game-mode-label" className="block text-sm font-medium text-slate-600 mb-2">Game Mode</label>
          <div className="flex bg-slate-100 rounded-lg p-1" role="radiogroup" aria-labelledby="game-mode-label">
            <button 
              onClick={() => setGameMode('standard')}
              className={cn("flex-1 py-2 rounded-md text-sm font-semibold", gameMode === 'standard' ? 'bg-romantic-500 text-white' : 'text-slate-600 hover:bg-slate-200')}
              role="radio"
              aria-checked={gameMode === 'standard'}
            >
              Standard
            </button>
            <button 
              onClick={() => setGameMode('random')}
              className={cn("flex-1 py-2 rounded-md text-sm font-semibold", gameMode === 'random' ? 'bg-romantic-500 text-white' : 'text-slate-600 hover:bg-slate-200')}
              role="radio"
              aria-checked={gameMode === 'random'}
            >
              Random <Dice5 size={14} className="inline-block ml-1" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
             {gameMode === 'standard' 
               ? "Choose your intensity for the whole game." 
               : "Intensity levels progress automatically from Friendly to Very Hot!"}
          </p>
        </div>

        {/* Intensity Selection for Standard Mode */}
        {gameMode === 'standard' && (
          <div className="mb-4">
            <label id="intensity-level-label" className="block text-sm font-medium text-slate-600 mb-2">Intensity Level</label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="intensity-level-label">
              {INTENSITY_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setIntensity(level.id)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                    intensity === level.id
                      ? 'border-romantic-500 bg-romantic-50 text-romantic-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  )}
                  role="radio"
                  aria-checked={intensity === level.id}
                >
                  <span className="text-2xl">{level.emoji}</span>
                  <span className="font-semibold text-sm">{level.label}</span>
                  <span className="text-xs text-slate-500 mt-1 leading-tight">{level.desc}</span>
                </button>
              ))}
            </div>
            {/* 18+ Warning for Very Hot Mode */}
            {intensity === 'very_hot' && (
              <div 
                className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm font-bold flex items-center gap-2"
                role="alert"
              >
                <AlertCircle size={18} /> 🌶️ Warning: Very Hot mode contains explicit and adult content (18+). Proceed with caution and consent from both players.
              </div>
            )}
          </div>
        )}
      </div>

      {!isTestMode && (
        <>
          <div className="flex items-center justify-between text-lg font-bold text-romantic-600 bg-romantic-50 p-4 rounded-xl border border-romantic-200 shadow-inner">
            <span>Game Code:</span>
            <span className="font-mono text-2xl tracking-widest">{gameCode}</span>
            <Button onClick={copyCode} variant="secondary" size="sm" className="p-2 bg-romantic-100 text-romantic-600 hover:bg-romantic-200" aria-label="Copy game code">
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={copyLink} variant="secondary" className="flex-1 flex items-center justify-center gap-2 py-3 px-4" aria-label="Copy invite link">
              {linkCopied ? <Check size={20} /> : <Link size={20} />} Copy Link
            </Button>
            <Button onClick={handleShare} variant="secondary" className="flex-1 flex items-center justify-center gap-2 py-3 px-4" aria-label="Share game link">
              <Share2 size={20} /> Share
            </Button>
          </div>
        </>
      )}
      <Button
        onClick={onStartGame}
        variant="primary"
        className="w-full py-3 px-6 shadow-lg flex items-center justify-center gap-2"
        disabled={!name.trim()}
      >
        <Play size={20} /> Start Game
      </Button>
    </div>
  );
};