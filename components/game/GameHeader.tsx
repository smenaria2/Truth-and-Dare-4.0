
import React from 'react';
import { LogOut, Video, AlertCircle, Trophy, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '../common/Button';
import { TutorialTooltip } from '../TutorialTooltip';
import { INTENSITY_LEVELS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { CallStatus, GameMode, IntensityLevel, PlayerRole, GameState } from '../../lib/types';

interface GameHeaderProps {
  onExit: () => void;
  gameCode: string;
  isTestMode?: boolean;
  currentIntensityEmoji: string;
  currentIntensityLabel: string;
  currentActiveIntensity: IntensityLevel;
  gameMode: GameMode;
  questionsAnsweredInCurrentLevel: number;
  questionsPerRandomLevel: number;
  showIntensitySelector: boolean;
  setShowIntensitySelector: (show: boolean) => void;
  requestIntensityChange: (level: IntensityLevel) => void;
  scores: GameState['scores'];
  hostName: string;
  guestName: string;
  role: PlayerRole;
  handleStartCall: () => void;
  callStatus: CallStatus;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  isCallMinimized?: boolean;
  toggleCallMinimize?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  onExit,
  gameCode,
  isTestMode,
  currentIntensityEmoji,
  currentIntensityLabel,
  currentActiveIntensity,
  gameMode,
  questionsAnsweredInCurrentLevel,
  questionsPerRandomLevel,
  showIntensitySelector,
  setShowIntensitySelector,
  requestIntensityChange,
  scores,
  hostName,
  guestName,
  role,
  handleStartCall,
  callStatus,
  connectionStatus,
  isCallMinimized,
  toggleCallMinimize
}) => {

  const connectionStatusColor = 
    connectionStatus === 'connected' ? 'bg-green-500' :
    connectionStatus === 'reconnecting' ? 'bg-orange-400' :
    'bg-red-500';

  const connectionStatusText = 
    connectionStatus === 'connected' ? 'Connected' :
    connectionStatus === 'reconnecting' ? 'Reconnecting...' :
    'Disconnected';

  const connectionStatusTextColor = 
    connectionStatus === 'connected' ? 'text-green-600' :
    connectionStatus === 'reconnecting' ? 'text-orange-500' :
    'text-red-600';

  const handleVideoClick = () => {
    if (callStatus === 'connected' && toggleCallMinimize) {
      toggleCallMinimize();
    } else {
      handleStartCall();
    }
  };

  return (
    <header className="bg-white border-b border-slate-100 p-3 z-10 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Button onClick={onExit} variant="ghost" size="sm" className="text-slate-400" aria-label="Exit Game">
            <LogOut size={18} />
          </Button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-romantic-500 tracking-wider">TRUTH X DARE</span>
            {!isTestMode && <span className="text-[10px] text-slate-400">Code: {gameCode}</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <div className={cn("w-2 h-2 rounded-full", connectionStatusColor, connectionStatus === 'connected' && 'animate-pulse')}></div>
            <span className={cn("text-[10px] font-bold uppercase", connectionStatusTextColor)}>
              {isTestMode ? "Sandbox" : connectionStatusText}
            </span>
          </div>

          <TutorialTooltip content="Change question spice level here!" isVisible={!!isTestMode}>
            <div className="relative">
              <Button 
                onClick={() => setShowIntensitySelector(!showIntensitySelector)}
                disabled={gameMode === 'random'}
                variant="secondary"
                size="sm"
                className={cn("flex items-center gap-1 px-3 py-1 text-xs font-medium",
                  gameMode === 'random' ? "cursor-not-allowed opacity-70" : ""
                )}
                aria-haspopup="true"
                aria-expanded={showIntensitySelector}
                aria-label="Change intensity level"
              >
                <span>{currentIntensityEmoji}</span>
                <span className="capitalize hidden sm:inline">
                  {gameMode === 'random' ? currentIntensityLabel : INTENSITY_LEVELS.find(l => l.id === currentActiveIntensity)?.label || 'Friendly'}
                </span>
              </Button>
              {showIntensitySelector && (
                <div 
                  className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 w-48 overflow-hidden z-[60] animate-fade-in"
                  role="menu"
                >
                  <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">Change Intensity</div>
                  {INTENSITY_LEVELS.map(level => (
                    <button 
                      key={level.id}
                      onClick={() => requestIntensityChange(level.id)}
                      className={cn("w-full text-left px-4 py-3 text-sm flex items-center gap-2 hover:bg-slate-50", 
                        level.id === currentActiveIntensity && "bg-romantic-50 text-romantic-700 font-bold"
                      )}
                      role="menuitem"
                    >
                      <span>{level.emoji}</span>
                      <span>{level.label}</span>
                      {level.id === 'very_hot' && <span className="text-red-500 font-bold ml-1 text-xs">(18+)</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TutorialTooltip>

          <TutorialTooltip content="Start a video call" isVisible={!!isTestMode}>
            <Button 
              onClick={handleVideoClick} 
              disabled={callStatus === 'ringing'}
              variant="secondary"
              size="sm"
              className={cn("bg-romantic-50 text-romantic-600 hover:bg-romantic-100 hover:text-romantic-700 border-romantic-200 transition-all", 
                callStatus !== 'idle' && "bg-green-100 text-green-600 border-green-200",
                callStatus === 'ringing' && "animate-pulse"
              )}
              aria-label="Video Call"
            >
              {callStatus === 'connected' && isCallMinimized ? <Maximize2 size={20} /> : <Video size={20} />}
            </Button>
          </TutorialTooltip>
        </div>
      </div>

      {/* 18+ Warning for Very Hot Mode */}
      {((gameMode === 'standard' && currentActiveIntensity === 'very_hot') || 
       (gameMode === 'random' && currentActiveIntensity === 'very_hot')) && (
        <div 
          className="bg-red-50 text-red-700 p-2 text-xs font-bold text-center flex items-center justify-center gap-1 border-b border-red-100 animate-fade-in"
          role="alert"
        >
          <AlertCircle size={14} /> 🌶️ Mature Content (18+)
        </div>
      )}

      {/* Scoreboard */}
      <TutorialTooltip content="Track who is winning! Dares give more points." isVisible={!!isTestMode} position="bottom" className="w-full">
        <div className="flex bg-slate-50 rounded-lg p-2 items-center justify-between shadow-inner w-full">
          <div className="flex flex-col items-center w-1/3">
            <span className="text-[10px] uppercase font-bold text-slate-500">{role === 'host' ? 'You' : hostName}</span>
            <span className="text-lg font-black text-slate-800">{scores.host}</span>
          </div>
          <div className="text-romantic-300"><Trophy size={16} /></div>
          <div className="flex flex-col items-center w-1/3">
            <span className="text-[10px] uppercase font-bold text-slate-500">{role === 'guest' ? 'You' : guestName}</span>
            <span className="text-lg font-black text-slate-800">{scores.guest}</span>
          </div>
        </div>
      </TutorialTooltip>
    </header>
  );
};
