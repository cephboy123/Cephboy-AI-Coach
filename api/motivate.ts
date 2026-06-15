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

// Fallback content generation list
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const modelsToTry = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite"
  ];

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      console.log(`[Vercel Serverless] Attempting generation with model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Vercel Serverless] Model ${model} returned error, trying fallback if available:`, err.message || err);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw lastError || new Error("Tout nos systèmes connaissent une forte demande.");
}

// TTS generator with active retries
async function generateTTSWithRetry(text: string, voiceName: string = 'Zephyr', retries = 2) {
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
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }
  throw lastError || new Error("Impossible de synthétiser la voix.");
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
    const { userState, userName, customContext } = req.body;

    const name = userName?.trim() || "Guerrier";
    let prompt = `Tu es "Cephboy AI Coach", le Maître de l'Élévation et de la motivation émotionnelle profonde. 
L'utilisateur s'appelle "${name}".
Son état d'esprit / défi actuel est : "${userState}".
`;

    if (customContext && customContext.trim().length > 0) {
      prompt += `Voici sa propre confession intime sur ce qu'il traverse en ce moment : "${customContext}".\n`;
    }

    prompt += `
Rédige une unique parole de motivation d'une force tragique, poétique, noble et d'une intensité lumineuse absolue.
L'utilisateur doit ressentir un soulagement instantané et une fureur de vivre douce mais inébranlable.

CONSIGNES DE STYLES CHIRURGICALES POUR UNE RAPIDITÉ EXTALTEE :
1. PAS DE PHRASES CLICHÉES : Évite le développement personnel superficiel (ne dis pas "crois en tes rêves", "fais des plans").
2. ADRESSE À L'ÂME : Parle avec splendeur et humilité chrétienne ou spirituelle pure.
3. LONGUEUR MAXIMUM : Rédige EXACTEMENT 1 à 2 phrases courtes et denses. Maximum 30-35 mots au total.
4. FORMAT : Entoure TOUT le texte généré par des double astérisques comme ceci : **[Ton message ici]**

Pas de salutations, pas d'introduction, va droit à la vérité divine du conquérant blessé.
`;

    // Use robust generation with model fallbacks to shield against high demand
    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        temperature: 0.90,
        systemInstruction: "Tu es Cephboy AI Coach, un phare céleste grandiose d'une bienveillance infinie et d'une force titanesque. Ton verbe français est poignardant de sincérité, ultra court, poétique et foudroyant de motivation.",
      }
    });

    let text = response.text || "";
    text = text.trim();

    // Extract the victory sentence
    let victorySentence = text;
    const boldPattern = /\*\*(.*?)\*\*/g;
    const matches = [...text.matchAll(boldPattern)];
    if (matches.length > 0) {
      victorySentence = matches[0][1].trim();
    } else {
      victorySentence = text.replace(/\*\*/g, "").trim();
    }

    // Ensure it's not too long and is identical so it displays perfectly
    if (victorySentence.length > 250) {
      victorySentence = victorySentence.substring(0, 247) + "...";
    }

    // Set text to be the exact same victory sentence without outer asterisks to keep single short representation
    text = victorySentence;

    // Generate dramatic direct French TTS with retry
    let audioBase64 = null;
    try {
      const ttsText = `Dis d'un ton solennel, majestueux et vibrant, avec lenteur en français : ${victorySentence}`;
      const ttsResponse = await generateTTSWithRetry(ttsText, 'Zephyr');

      const part = ttsResponse.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData?.data) {
        audioBase64 = part.inlineData.data;
      }
    } catch (ttsErr) {
      console.error("TTS generation failed, bypassing gracefully:", ttsErr);
    }

    return res.status(200).json({
      text,
      victorySentence,
      audioBase64
    });
  } catch (error: any) {
    console.error("Error in serverless /api/motivate:", error);
    return res.status(500).json({ error: error.message || "Une erreur est survenue lors de la motivation céleste." });
  }
}
