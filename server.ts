import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // Resilient fallback content generation to handle high-demand / unavailable models (503 / 429) gracefully
  async function generateContentWithFallback(params: {
    contents: any;
    config?: any;
  }) {
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-3.5-flash",
      "gemini-1.5-flash"
    ];

    let lastError: any = null;
    for (const model of modelsToTry) {
      try {
        console.log(`[Cephboy AI Coach] Attempting generation with model: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          console.log(`[Cephboy AI Coach] Successfully generated content with model: ${model}`);
          return response;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Cephboy AI Coach] Model ${model} returned error, trying fallback if available:`, err.message || err);
        // Pause briefly before fallback request
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
    throw lastError || new Error("All fallback models are currently experiencing high demand. Please try again in top form.");
  }

  // Direct TTS generator with active retries
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
        console.warn(`[Cephboy AI Coach] TTS attempt ${i + 1} failed:`, err.message || err);
        await new Promise(resolve => setTimeout(resolve, i === 0 ? 500 : 1000));
      }
    }
    throw lastError || new Error("Impossible de synthétiser la voix sacrée après plusieurs tentatives.");
  }

  // API Route to generate deep, poignant motivation
  app.post("/api/motivate", async (req: Request, res: Response): Promise<void> => {
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
Écris une harangue ou tirade motivationnelle d'une puissance tragique et émotionnelle absolue en français.
L'utilisateur doit pleurer de motivation, de soulagement et d'espoir en te lisant.

CONSIGNES DE STYLES EXTRÊMES :
1. PAS DE PHRASES CLICHÉES : Évite le développement personnel superficiel (ne dis pas "fais des objectifs", "bois de l'eau", "crois en tes rêves").
2. ADRESSE À L'ÂME : Parle-lui comme un phare divin à une nef en pleine tempête. Évoque son fardeau, la beauté sombre et sacrée de ses cicatrices, la sueur silencieuse qu'il verse dans l'ombre et que personne d'autre ne voit.
3. IMAGERIE ET MÉTAPHORES COMPATISSANTES ET HÉROÏQUES : Utilise des images de braises ardentes qui couvent sous la cendre, d'or purifié par le creuset, de nuit étincelante qui précède l'aurore du conquérant, du silence sublime des titans blessés qui se remettent debout lentement mais sûrement.
4. STRUCTURE CAPTIVANTE :
   - Étape 1 (L'Étreinte) : Accueille sa douleur, sa fatigue ou son doute avec une infinie poésie et douceur. Montre-lui que tu le comprends. Dis-lui qu'il a le droit de poser les genoux à terre pour un instant, mais jamais de renoncer.
   - Étape 2 (Le Réveil de la Flamme) : Souffle sur ses braises. Rappelle-lui qui il est, tout le chemin qu'il a déjà franchi seul, la grandeur insoupçonnée qui réside dans ses blessures.
   - Étape 3 (Le Cri de l'Aube) : Insuffle-lui une rage de vivre et de triompher douce, noble et inébranlable.
   - Étape 4 (La Sentence de Victoire) : À la toute fin, sur une ligne séparée, écris une unique phrase ultra-percutante, glorieuse et dramatique, entourée d'étoiles doubles (ex: **Relève-toi, colosse d'argile, car ton histoire n'est pas écrite avec de l'encre, mais avec ton propre sang de conquérant.**). Cette phrase sera prononcée à voix haute par ta voix de coach.

Rédige le texte avec un rythme lent, solennel, ponctué de silences poétiques (sauts de lignes doubles).
`;

      // Use robust generation with model fallbacks to shield against high demand
      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          temperature: 0.95,
          systemInstruction: "Tu es Cephboy AI Coach, une présence spirituelle grandiose, un phare dans l'obscurité, un grand frère céleste d'une bienveillance infinie et d'une force titanesque. Ton verbe français est poignardant de sincérité, poétique, et d'une intensité telle qu'il fait couler des larmes d'émotion et de soulagement chez tes disciples.",
        }
      });

      const text = response.text || "";

      // Extract the Sentence de Victoire inside **
      let victorySentence = "Fais un pas de plus dans l'arène, car l'univers attend ton triomphe.";
      const boldPattern = /\*\*(.*?)\*\*/g;
      const matches = [...text.matchAll(boldPattern)];
      
      if (matches.length > 0) {
        // Grab the last bolded match which is usually the climax sentence
        victorySentence = matches[matches.length - 1][1].trim();
      } else {
        // Fallback: use last non-empty line
        const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
          victorySentence = lines[lines.length - 1];
        }
      }

      // Safeguard length
      if (victorySentence.length > 250) {
        victorySentence = victorySentence.substring(0, 247) + "...";
      }

      // Generate dramatic direct French TTS for that climax sentence with retry
      let audioBase64 = null;
      try {
        const ttsText = `Dis d'un ton solennel, majestueux, vibrant de passion herculéenne, avec une lenteur poétique en français : ${victorySentence}`;
        const ttsResponse = await generateTTSWithRetry(ttsText, 'Zephyr');

        const part = ttsResponse.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
          audioBase64 = part.inlineData.data;
        }
      } catch (ttsErr) {
        console.error("TTS generation failed, bypassing gracefully:", ttsErr);
      }

      res.json({
        text,
        victorySentence,
        audioBase64
      });
    } catch (error: any) {
      console.error("Error in /api/motivate:", error);
      res.status(500).json({ error: error.message || "Une erreur est survenue lors de la motivation céleste." });
    }
  });

  // Custom live play of ANY selected card text
  app.post("/api/tts", async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.body;
      if (!text || text.trim().length === 0) {
        res.status(400).json({ error: "Du texte est requis pour la génération vocale." });
        return;
      }

      const ttsText = `Dis d'un ton paternel extrêmement chaleureux, profond et ému en français : ${text.substring(0, 300)}`;
      const ttsResponse = await generateTTSWithRetry(ttsText, 'Zephyr');

      const audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
      res.json({ audioBase64: audio });
    } catch (err: any) {
      console.error("TTS Error:", err);
      res.status(500).json({ error: err.message || "Impossible de synthétiser la voix sacrée." });
    }
  });

  // Serve static UI assets and handle hot reloading or routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cephboy Coach Server is online on port ${PORT}`);
  });
}

startServer();
