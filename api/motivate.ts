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
  system_instruction?: string;
}) {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash"
  ];

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      console.log(`[Vercel Serverless] Attempting generation with model: ${model}`);
      const interaction = await ai.interactions.create({
        model: model,
        input: params.contents,
        system_instruction: params.system_instruction,
        generation_config: params.config,
      });
      if (interaction && interaction.output_text) {
        return { text: interaction.output_text };
      }
    } catch (err: any) {
      lastError = err;
      const isQuotaError = err.status === 429 || (err.error && err.error.code === 429) || (err.message && err.message.includes("429"));
      
      if (isQuotaError) {
        throw new Error("Quota API atteint. Veuillez vérifier vos limites.");
      }

      console.warn(`[Vercel Serverless] Model ${model} returned error, trying fallback if available:`, err.message || err);
      // Increased delay for exponential-like backoff
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw lastError || new Error("Tout nos systèmes connaissent une forte demande.");
}


function getOfflineFallback(stateId: string, userName: string, language: string): string {
  const normalizedState = (stateId || "daily").toLowerCase();
  
  const pool: Record<string, Record<string, string>> = {
    english: {
      exhausted: `Get up, ${userName}. Your fatigue today is the raw steel that shields your triumph tomorrow.`,
      discouraged: `Silence does not mean defeat, ${userName}. Masterpieces are built in the dark before they see light.`,
      crossroads: `Doubt is a fertile trap, ${userName}. Choose your next direction and face it with absolute courage.`,
      broken: `Scars are not failures, ${userName}. They are the living evidence that you endured when the world fell.`,
      guerre: `The arena is ready for you, ${userName}. Take a deep breath, break your fear, and let them see your power.`,
      daily: `Discipline is your only true companion, ${userName}. Every single day without excuses builds your empire.`
    },
    french: {
      exhausted: `Lève la tête, ${userName}. Ta fatigue d'aujourd'hui est le bouclier d'acier de ton triomphe demain.`,
      discouraged: `Le silence n'efface pas tes efforts, ${userName}. L'œuvre se bâtit dans l'ombre avant de briller.`,
      crossroads: `Le doute est un piège stérile, ${userName}. Choisis une voie maintenant et domine-la de ton audace.`,
      broken: `Une cicatrice n'est pas une défaite, ${userName}. C'est la preuve que tu as résisté quand tout s'effondrait.`,
      guerre: `L'arène est prête pour toi, ${userName}. Inspire profondément, brise ta peur, et impose ta puissance.`,
      daily: `La discipline est ta seule arme fidèle, ${userName}. Chaque matinée sans excuses façonne ton destin.`
    },
    spanish: {
      exhausted: `Levántate, ${userName}. Tu fatiga de hoy es el escudo de acero de tu triunfo de mañana.`,
      discouraged: `El silencio no oculta tus esfuerzos, ${userName}. La obra maestra se construye en la oscuridad.`,
      crossroads: `La duda es un carril esstéril, ${userName}. Elige un camino ahora y domínalo con valentía.`,
      broken: `Las cicatrices no son derrotas, ${userName}. Demuestran que resististe cuando todo se derrumbaba.`,
      guerre: `La arena está lista para ti, ${userName}. Respira hondo, rompe el miedo y muestra tu poder.`,
      daily: `La disciplina es tu única aliada leal, ${userName}. Cada mañana sin excusas creas tu propio destino.`
    }
  };

  const langKey = (language || "English").toLowerCase();
  const langSet = pool[langKey] || pool["english"];
  return langSet[normalizedState] || langSet["daily"];
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
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

  let bodyData: any = {};
  try {
    bodyData = req.body || {};
  } catch (e) {
    bodyData = {};
  }

  const { userState, userName, stateId, customContext, language, recentPhrases, voiceName } = bodyData;
  const name = userName?.trim() || "Champion";
  const targetLang = language || "French";

  try {
    
    let avoidanceInstruction = "";
    if (Array.isArray(recentPhrases) && recentPhrases.length > 0) {
      if (targetLang === "French") {
        avoidanceInstruction = `\nCRITICAL: Ne propose JAMAIS les phrases ou concepts de motivation suivants ni aucune variante proche de celles-ci. Sois complètement original et écris un texte totalement différent :\n${recentPhrases.map((p: string) => `- "${p}"`).join("\n")}`;
      } else {
        avoidanceInstruction = `\nCRITICAL: NEVER generate the following motivation lines or concepts. Create something completely fresh, original and different:\n${recentPhrases.map((p: string) => `- "${p}"`).join("\n")}`;
      }
    }

    const systemInstruction = targetLang === "French" 
      ? `Agis uniquement comme le Cephboy AI Coach, un mentor de motivation légendaire. Génère une motivation émotionnelle et percutante de 300 mots en français. Ne propose jamais de salutations, de titres ou d'explications sur ton fonctionnement. Écris directement le texte de motivation.`
      : `Act strictly as the Cephboy AI Coach, a legendary motivational mentor. Generate an emotional, impactful motivation of 300 words in English. Never provide greetings, titles, or explanations about your functionality. Write the motivation text directly.`

    const userPrompt = targetLang === "French"
      ? `Écris une motivation pour ${name} sur le défi : "${userState}". Contexte additionnel : ${customContext || "Aucun"}. ${avoidanceInstruction}`
      : `Write a motivation for ${name} regarding the challenge: "${userState}". Additional context: ${customContext || "None"}. ${avoidanceInstruction}`;

    const interaction = await generateContentWithFallback({
      contents: userPrompt,
      config: {
        temperature: 0.95,
        max_output_tokens: 1000,
      },
      system_instruction: systemInstruction,
    });

    let text = interaction.text || "";
    text = text.trim();

    // Clean up formatting remnants
    const cleanSentence = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/^"+|"+$/g, "")
      .replace(/^«+|»+$/g, "")
      .trim();

    // Sécurité de taille augmentée pour ne plus couper tes textes de 300 mots !
    if (cleanSentence.length > 3000) {
      return res.status(200).json({
        text: cleanSentence.substring(0, 2997) + "...",
        victorySentence: cleanSentence.substring(0, 2997) + "...",
        audioBase64: null
      });
    }

    return res.status(200).json({
      text: cleanSentence,
      victorySentence: cleanSentence,
      audioBase64: null
    });
  } catch (error: any) {
    console.warn("[Motivate API] Quota or API limit hit, gracefully falling back:", error.message || error);
    const fallbackSentence = getOfflineFallback(stateId, name, targetLang);
    return res.status(200).json({
      text: fallbackSentence,
      victorySentence: fallbackSentence,
      audioBase64: null,
      quotaExhausted: true
    });
  }
}
