import React from 'react';
import { Users } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface JoinGamePageProps {
  name: string;
  setName: (name: string) => void;
  gameCode: string;
  setGameCode: (code: string) => void;
  onJoinGame: () => void;
}

export const JoinGamePage: React.FC<JoinGamePageProps> = ({
  name,
  setName,
  gameCode,
  setGameCode,
  onJoinGame,
}) => {
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
      <Input
        type="text"
        placeholder="Game Code"
        value={gameCode}
        onChange={(e) => setGameCode(e.target.value.toUpperCase())}
        maxLength={6}
        className="uppercase"
        aria-label="Game Code"
      />
      <Button
        onClick={onJoinGame}
        variant="primary"
        className="w-full py-3 px-6 shadow-lg flex items-center justify-center gap-2"
        disabled={!name.trim() || gameCode.length !== 6}
      >
        <Users size={20} /> Join Game
      </Button>
    </div>
  );
};