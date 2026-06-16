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

    const name = userName?.trim() || "Champion";
    let prompt = `Tu es "Cephboy AI Coach", la voix off légendaire et le mentor ultime issu des plus grands films de sport et vidéos de motivation de l'histoire (type Rocky, Any Given Sunday, Creed).
L'utilisateur s'appelle "${name}".
Son défi ou état d'esprit actuel est : "${userState}".
`;

    if (customContext && customContext.trim().length > 0) {
      prompt += `Voici ce qu'il traverse ou cherche à surmonter actuellement : "${customContext}".\n`;
    }

    prompt += `
Rédige une unique parole choc de motivation d'un dynamisme cinématographique foudroyant et d'une force brute absolue.
L'utilisateur doit ressentir un frisson immédiat de discipline, d'action et une détermination d'acier.

CONSIGNES DE MOTIVATION CINÉMATOGRAPHIQUE CHIRURGICALE :
1. INTERDICTION DE MOTS CLICHÉS DE JEU DE RÔLE : N'utilise JAMAIS les mots "guerrier", "guerrière", "soldat", "titan", "colosse", "divin", "sacré", "céleste", "oracle", "château", "royaume", "prêtre", "temple", "sacrement", "sermon", "conquérant", "abîme", "parchemin". Ces clichés de fantaisie médiévale sont proscrits.
2. DISCIPLINE ET ACTIONS CONCRÈTES : Parle de sueur, de persévérance, d'honorer ses engagements secrets, d'endurer l'effort, de se relever à chaque coup et de se concentrer sur l'objectif présent. Pas de développement personnel superficiel.
3. CONSIGNE ABSOLUE DE DÉPART : Ne commence JAMAIS la phrase générée par un prénom, un mot de salutation, ou une interpellation (comme 'Champion, ...', 'Sébastien, ...', 'Guerrier, ...', 'Écoute-moi', etc.). Entre DIRECTEMENT dans le vif du sujet et la motivation brute dès le tout premier mot. Tu n'as pas de temps à perdre avec des préambules.
4. ADRESSE DIRECTE : Parle-lui directement de manière fraternelle et intense, comme un coach sportif de haut niveau sur le terrain. Tu peux utiliser son prénom ou le mot "Champion" uniquement vers le milieu ou la fin, JAMAIS au début.
5. LONGUEUR MAXIMUM : Rédige EXACTEMENT 2 phrases très denses et ultra-impactantes. Maximum 35 mots au total.
6. FORMAT : Entoure TOUT le texte généré par des double astérisques comme ceci : **[Ton message ici]**

Pas d'introduction, pas de politesse, aucun nom ou surnom en tout premier mot de la phrase, va immédiatement droit au but avec la force des tripes.
`;

    // Use robust generation with model fallbacks to shield against high demand
    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        temperature: 0.95,
        systemInstruction: "Tu es Cephboy AI Coach, la voix off moderne et ultra-impactante des plus grands films de sport et vidéos de motivation. Ton verbe français est ancré dans la réalité, direct, plein de tripes, axé sur la discipline, l'effort physique et mental, et l'action. Tu bannis les termes de fantaisie médiévale comme 'guerrier' ou 'divin'. Tu ne commences JAMAIS tes phrases par un prénom ou une interpellation d'accueil.",
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

    // Quick text return - TTS is requested lazy asynchronously from the frontend to optimize load speed to the absolute speed of light!
    return res.status(200).json({
      text,
      victorySentence,
      audioBase64: null
    });
  } catch (error: any) {
    console.error("Error in serverless /api/motivate:", error);
    return res.status(500).json({ error: error.message || "Une erreur est survenue lors de la motivation céleste." });
  }
}
