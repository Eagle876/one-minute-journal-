import { GoogleGenAI, Type } from "@google/genai";

export async function analyzeSentiment(text: string) {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is not configured.');
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the sentiment of this journal entry. Provide a mood (one word like Happy, Sad, Anxious, Calm, Excited, Neutral), a corresponding emoji, and a sentiment score from -1 to 1.
      
      Journal Entry: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING },
            emoji: { type: Type.STRING },
            score: { type: Type.NUMBER },
            insight: { type: Type.STRING, description: "A brief empathetic insight or advice based on the mood." }
          },
          required: ["mood", "emoji", "score", "insight"]
        }
      }
    });

    return JSON.parse(response.text?.trim() || "{}");
  } catch (error) {
    console.error('Gemini: Sentiment analysis error', error);
    return { mood: 'Neutral', emoji: '😐', score: 0, insight: 'Analysis unavailable.' };
  }
}

export async function transcribeAndAnalyze(base64Audio: string, mimeType: string) {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Gemini: API Key is missing!');
    throw new Error('Gemini API key is not configured. Please check your environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey });
  console.log('Gemini: Starting transcription and analysis...', { mimeType, audioLength: base64Audio.length });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType
            }
          },
          {
            text: `Transcribe this audio journal entry and analyze its sentiment. Provide the transcription, a mood (one word like Happy, Sad, Anxious, Calm, Excited, Neutral), a corresponding emoji, a sentiment score from -1 to 1, and a brief empathetic insight or advice.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: { type: Type.STRING },
            mood: { type: Type.STRING },
            emoji: { type: Type.STRING },
            score: { type: Type.NUMBER },
            insight: { type: Type.STRING }
          },
          required: ["transcription", "mood", "emoji", "score", "insight"]
        }
      }
    });

    const text = response.text?.trim();
    if (!text) {
      console.warn('Gemini: Received empty text response, using defaults');
      return {
        transcription: "Transcription unavailable",
        mood: "Neutral",
        emoji: "😐",
        score: 0,
        insight: "We couldn't analyze the audio this time, but your journal has been saved."
      };
    }

    try {
      const result = JSON.parse(text);
      console.log('Gemini: Analysis successful', result);
      return result;
    } catch (parseError) {
      console.error('Gemini: JSON parse error', text);
      return {
        transcription: text.substring(0, 500),
        mood: "Neutral",
        emoji: "😐",
        score: 0,
        insight: "Journal recorded, but AI analysis failed."
      };
    }
  } catch (error: any) {
    console.error('Gemini: API Error', error);
    throw new Error(`AI processing failed: ${error.message || 'Unknown network error'}`);
  }
}
