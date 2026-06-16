import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// TTS generator with active retries
async function generateTTSWithRetry(text: string, voiceName: string = 'Zephyr', retries = 3) {
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Vercel Serverless] TTS attempt ${i + 1} failed:`, err.message || err);
      await new Promise(resolve => setTimeout(resolve, i === 0 ? 500 : 1000));
    }
  }
  throw lastError || new Error("Impossible de synthétiser la voix sacrée.");
}

export default async function handler(req: any, res: any) {
  // Set CORS headers for Vercel functions
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  try {
    const { text, voiceGender } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Du texte est requis pour la génération vocale." });
    }

    const selectedVoice = voiceGender === "female" ? "Aoede" : "Charon";
    const ttsText = `Dis d'un ton chaleureux, profond et déterminé en français : ${text.substring(0, 300)}`;
    const ttsResponse = await generateTTSWithRetry(ttsText, selectedVoice);

    const audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    return res.status(200).json({ audioBase64: audio });
  } catch (err: any) {
    console.error("TTS serverless error:", err);
    return res.status(500).json({ error: err.message || "Impossible de synthétiser la voix sacrée." });
  }
}
