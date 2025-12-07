import { IntensityLevel, PlayerRole, TurnRecord } from "./types";

/**
 * Calculates the current streak for a given player and turn type.
 * A streak counts consecutive confirmed turns of the same type by the player.
 * @param type The type of turn ('truth' or 'dare').
 * @param history The array of past turn records.
 * @param player The role of the player whose streak is being calculated.
 * @returns The length of the current streak.
 */
export const getStreak = (type: 'truth' | 'dare', history: TurnRecord[], player: PlayerRole) => {
    let streak = 0;
    // Iterate backwards through confirmed turns
    for (let i = history.length - 1; i >= 0; i--) {
        const turn = history[i];
        if (turn.playerRole !== player) continue;
        if (turn.status === 'confirmed') {
            if (turn.type === type) streak++;
            else break; // Break on first mismatch in type
        } else {
            // If an unconfirmed turn is encountered, break as it interrupts the streak
            break;
        }
    }
    return streak;
};

/**
 * Calculates the score value for selecting a new turn, considering the current streak.
 * Truth rewards decrease with streak, Dare rewards increase.
 * @param type The type of turn ('truth' or 'dare').
 * @param history The array of past turn records.
 * @param player The role of the player selecting the turn.
 * @returns The calculated points for the next turn.
 */
export const calculateScoreValue = (type: 'truth' | 'dare', history: TurnRecord[], player: PlayerRole) => {
    const currentStreak = getStreak(type, history, player);
    const streakIfSelected = currentStreak + 1; // Points for what the streak *would be* if this turn is confirmed
    
    if (type === 'truth') {
        return Math.max(5, 30 - ((streakIfSelected - 1) * 5)); 
    } else { // Dare
        return 60 + ((streakIfSelected - 1) * 10);
    }
};