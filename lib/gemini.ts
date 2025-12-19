
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateAIQuestion(type: 'truth' | 'dare', intensity: string, keywords?: string): Promise<string> {
  const ai = getAI();
  try {
    const keywordContext = keywords ? ` Incorporate these themes or keywords: "${keywords}".` : "";
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert in couples intimacy and fun games. Generate a single, unique, and engaging ${type} question for a couples game.
      The intensity level is "${intensity}".${keywordContext}
      - Friendly: Sweet, lighthearted, focuses on fun memories.
      - Romantic: Deep emotional connection, future dreams, meaningful sentiments.
      - Hot: Spicy attraction, physical teasing, suggestive desires.
      - Very Hot: Explicit, high-intimacy, bold fantasies.
      Return ONLY the question text. Do not use quotation marks. Keep it concise (under 25 words) to ensure it fits on a game card.`,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini AI Question Error:", error);
    return "";
  }
}

export async function generateAIReaction(question: string, answer: string, type: 'truth' | 'dare'): Promise<string> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `A couple is playing Truth or Dare.
      The question was: "${question}"
      The answer/response was: "${answer}"
      The type was: "${type}"
      Provide a short (max 12 words), witty, and playful reaction to this response as a neutral game host. 
      Be encouraging and slightly cheeky if the context is romantic or spicy.`,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini AI Reaction Error:", error);
    return "";
  }
}
