import React, { useState, useEffect } from 'react';
import { GameRoom } from './components/GameRoom';
import { IntensityLevel, GameMode, SavedSession } from './lib/types';
import { HomePage } from './components/home/HomePage';
import { CreateGamePage } from './components/game-setup/CreateGamePage';
import { JoinGamePage } from './components/game-setup/JoinGamePage';
import { Sparkles } from 'lucide-react';

type AppScreen = 'home' | 'create' | 'join' | 'play';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [role, setRole] = useState<'host' | 'guest'>('host');
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [intensity, setIntensity] = useState<IntensityLevel>('friendly');
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [isTestMode, setIsTestMode] = useState(false);
  const [recentSessions, setRecentSessions] = useState<SavedSession[]>([]);

  // Load recent sessions on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tod_sessions');
      if (stored) setRecentSessions(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  }, [screen]); // Refresh when screen changes (e.g. coming back from a game)

  // Check for invite link on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setGameCode(code);
      setRole('guest');
      setScreen('join');
    }
  }, []);

  const requestNotifyPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  const handleCreateGame = () => {
    requestNotifyPermission();
    setRole('host');
    setScreen('create');
  };

  const handleJoinSetup = () => {
    requestNotifyPermission();
    setRole('guest');
    setScreen('join');
  };

  const handleSandboxClick = () => {
    setIsTestMode(true);
    handleCreateGame();
  };

  const enterLobby = () => {
    if (!name.trim()) return alert("Please enter your name");
    setScreen('play'); // Directly go to play screen
  };

  const joinGame = () => {
    if (!name.trim()) return alert("Please enter your name");
    if (gameCode.length !== 6) return alert("Invalid game code");
    setScreen('play'); // Directly go to play screen
  };

  const rejoinSession = (session: SavedSession) => {
    requestNotifyPermission();
    setGameCode(session.gameCode);
    setRole(session.myRole);
    setName(session.myName);
    setIntensity(session.intensity);
    setGameMode(session.gameMode);
    setScreen('play');
  };

  const clearSessions = () => {
    if (confirm("Are you sure you want to clear your game history?")) {
      localStorage.removeItem('tod_sessions');
      setRecentSessions([]);
    }
  };

  const resetAppState = () => {
    setScreen('home');
    setIsTestMode(false);
    setName('');
    setGameCode('');
    setIntensity('friendly');
    setGameMode('standard');
  };

  if (screen === 'play') {
    return (
      <GameRoom
        role={role}
        gameCode={gameCode}
        playerName={name}
        intensity={intensity}
        gameMode={gameMode}
        isTestMode={isTestMode}
        onExit={resetAppState}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-slate-800">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center border-t-8 border-romantic-600">
        <h1 className="text-4xl font-black mb-2 text-romantic-700">Truth & Dare</h1>
        <p className="text-slate-500 mb-8 text-sm">Couples Edition</p>

        {screen === 'home' && (
          <HomePage
            onSandboxClick={handleSandboxClick} 
            onCreateGameClick={handleCreateGame}
            onJoinGameClick={handleJoinSetup}
            recentSessions={recentSessions}
            onRejoinSession={rejoinSession}
            onClearSessions={clearSessions}
          />
        )}

        {screen === 'create' && (
          <CreateGamePage
            name={name}
            setName={setName}
            gameCode={gameCode}
            setGameCode={setGameCode}
            intensity={intensity}
            setIntensity={setIntensity}
            gameMode={gameMode}
            setGameMode={setGameMode}
            onStartGame={enterLobby}
            isTestMode={isTestMode}
          />
        )}

        {screen === 'join' && (
          <JoinGamePage
            name={name}
            setName={setName}
            gameCode={gameCode}
            setGameCode={setGameCode}
            onJoinGame={joinGame}
          />
        )}

        <div className="mt-8 flex justify-center">
          {screen === 'home' ? (
             <button
              onClick={handleSandboxClick}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
            >
              <Sparkles size={12} /> Sandbox Mode
            </button>
          ) : (
            <button
              onClick={resetAppState}
              className="text-slate-400 hover:text-slate-600 text-sm"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-4">Made with ❤️ for long distance couples</p>
    </div>
  );
}