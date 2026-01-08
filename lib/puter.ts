
declare const puter: any;

/**
 * Ensures the user is signed in to Puter to use AI services.
 * Uses attempt_temp_user_creation to allow seamless onboarding without immediate sign-up.
 * Note: This must be called from within a user-initiated event (like a button click)
 * to prevent browsers from blocking the sign-in popup.
 */
async function ensurePuterAuth() {
  if (!puter.auth.isSignedIn()) {
    try {
      await puter.auth.signIn({ attempt_temp_user_creation: true });
    } catch (error) {
      console.error("Puter Auth Error:", error);
    }
  }
}

/**
 * Generates a Truth or Dare question using Puter AI.
 */
export async function generateAIQuestion(type: 'truth' | 'dare', intensity: string, keywords?: string): Promise<string> {
  await ensurePuterAuth();
  try {
    const keywordContext = keywords ? ` Incorporate these themes or keywords: "${keywords}".` : "";
    const prompt = `You are an expert in couples intimacy and fun games. Generate a single, unique, and engaging ${type} question for a couples game.
      The intensity level is "${intensity}".${keywordContext}

      CRITICAL INSTRUCTION: If the provided keywords are in a language other than English, generate the question IN THAT SAME LANGUAGE. Also, adapt the context and tone to match the cultural nuances associated with that language. If no specific language is detected in keywords, default to English.
      
      Intensity Guide:
      - Friendly: Sweet, lighthearted, focuses on fun memories.
      - Romantic: Deep emotional connection, future dreams, meaningful sentiments.
      - Hot: Spicy attraction, physical teasing, suggestive desires.
      - Very Hot: Explicit, high-intimacy, bold fantasies.
      
      Return ONLY the question text. Do not use quotation marks. Keep it concise (under 25 words) to ensure it fits on a game card.`;
    
    const response = await puter.ai.chat(prompt);
    return response.toString().trim();
  } catch (error) {
    console.error("Puter AI Question Error:", error);
    return "";
  }
}

/**
 * Generates an AI reaction to a player's answer using Puter AI.
 */
export async function generateAIReaction(question: string, answer: string, type: 'truth' | 'dare'): Promise<string> {
  await ensurePuterAuth();
  try {
    const prompt = `A couple is playing Truth or Dare.
      The question was: "${question}"
      The answer/response was: "${answer}"
      The type was: "${type}"
      Provide a short (max 12 words), witty, and playful reaction to this response as a neutral game host. 
      Be encouraging and slightly cheeky if the context is romantic or spicy.`;
    
    const response = await puter.ai.chat(prompt);
    return response.toString().trim();
  } catch (error) {
    console.error("Puter AI Reaction Error:", error);
    return "";
  }
}
