
export type IntensityLevel = "friendly" | "romantic" | "hot" | "very_hot";
export type PlayerRole = "host" | "guest";
export type GamePhase = "waiting" | "playing" | "reviewing";
export type MediaType = "photo" | "audio" | "video" | null;
export type CallStatus = "idle" | "offering" | "ringing" | "connected";
export type GameMode = "standard" | "random"; 

export interface PlayerInfo {
  name: string;
  role: PlayerRole;
  isReady: boolean;
}

export interface ChatMessage {
  id: string;
  senderRole: PlayerRole;
  senderName: string;
  text?: string;
  mediaType?: MediaType;
  mediaData?: string; // Base64
  timestamp: number;
  read?: boolean; // New: Read status
}

export interface TurnRecord {
  id: string;
  playerRole: PlayerRole; // Who played this turn
  questionText: string;
  type: "truth" | "dare";
  response?: string;
  mediaType?: MediaType;
  mediaData?: string; // Base64
  status: "selecting" | "pending" | "answered" | "confirmed" | "rejected" | "failed";
  timestamp: number;
  timeLimit?: number; // seconds, 0 = no limit
  startedAt?: number; // timestamp when question was sent/pending started
  loved?: boolean;
  isRetry?: boolean;
}

export interface GameState {
  gameCode: string;
  intensityLevel: IntensityLevel;
  gameMode: GameMode; // New: Current game mode
  currentRandomModeIntensity: IntensityLevel; // New: For random mode progression
  questionsAnsweredInCurrentLevel: number; // New: For random mode progression
  currentTurn: PlayerRole;
  phase: GamePhase;
  turnHistory: TurnRecord[];
  activeTurn: TurnRecord | null;
  hostName: string;
  guestName: string;
  scores: { host: number; guest: number };
  chatMessages: ChatMessage[];
  lastUpdated: number;
  autoSelectTurn?: boolean; // New: Auto-select Truth/Dare
}

export interface P2PMessage {
  type: 
    | "GAME_STATE_SYNC" 
    | "PLAYER_INFO" 
    | "CHAT_MESSAGE" 
    | "SUBMIT_ANSWER" 
    | "CONFIRM_TURN" 
    | "REJECT_TURN"
    | "SEND_REACTION"
    | "PING"
    | "CALL_OFFER"
    | "CALL_ACCEPT"
    | "CALL_REJECT"
    | "CALL_END"
    | "CALL_WINDOW_STATE"
    | "INTENSITY_REQUEST"
    | "INTENSITY_RESPONSE"
    | "RANDOM_LEVEL_UP" 
    | "PING_EMOJI"
    | "REALTIME_TYPING" 
    | "READ_RECEIPT"
    | "HEARTBEAT"
    | "REQUEST_PLAYER_INFO" // New: Request partner details
    | "PARTNER_DISCONNECTED" // New: LWT message
    | "TOGGLE_AUTO_SELECT"; // New: Sync auto-select setting
  payload: any;
}

export interface SavedSession {
  gameCode: string;
  hostName: string;
  guestName: string;
  myRole: PlayerRole;
  myName: string;
  scores: { host: number; guest: number };
  timestamp: number;
  intensity: IntensityLevel;
  gameMode: GameMode;
}