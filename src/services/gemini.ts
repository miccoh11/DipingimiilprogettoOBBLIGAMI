import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface QuizResult {
  character: string;
  mediaSource: string;
  justification: string;
  unhinged: string;
  caption: string;
  tags: string[];
  wikiSearchTerm: string;
  auraColor: string;
  vibeScore: string;
}

export async function getCharacterResult(answers: string[], language: 'it' | 'en'): Promise<QuizResult> {
  const prompt = language === 'it' 
    ? `Ecco le risposte del mio quiz:\n${answers.map((a, i) => `Domanda ${i + 1}: ${a}`).join('\n')}\n\nIn base a queste risposte, dimmi quale personaggio sono.`
    : `Here are my quiz answers:\n${answers.map((a, i) => `Question ${i + 1}: ${a}`).join('\n')}\n\nBased on these answers, tell me which character I am.`;

  const systemInstruction = language === 'it'
    ? `Sei un generatore creativo e conciso che associa risposte di quiz a personaggi reali di film o serie TV. Devi scegliere UN SOLO personaggio noto (nome completo), mostrandolo e fornire una breve motivazione (2-3 frasi), una "frase unhinged" (1 riga, memorizzabile) e una caption perfetta per lo screenshot da condividere sui social (max 12 parole). Mantieni tono Gen-Z, spiritoso, leggermente oscuro ma non offensivo. Formatta l'output come JSON valido con chiavi: character, mediaSource, justification, unhinged, caption, tags[], wikiSearchTerm, auraColor, vibeScore.
I tags NON devono contenere il simbolo #. Se il quiz suggerisce più risultati plausibili, scegli il più iconico. Se il personaggio include contenuti sensibili, neutralizza il linguaggio.`
    : `You are a creative and concise generator that matches quiz answers to real movie or TV show characters. You must choose ONLY ONE well-known character (full name), and provide a short justification (2-3 sentences), an "unhinged quote" (1 line, memorable), and a perfect caption for a social media screenshot (max 12 words). Keep a Gen-Z, witty, slightly dark but not offensive tone. Format the output as valid JSON with keys: character, mediaSource, justification, unhinged, caption, tags[], wikiSearchTerm, auraColor, vibeScore.
Tags MUST NOT contain the # symbol. If the quiz suggests multiple plausible results, choose the most iconic one. If the character includes sensitive content, neutralize the language. Respond entirely in English.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          character: { type: Type.STRING },
          mediaSource: { type: Type.STRING, description: "Il nome del film o della serie TV da cui proviene il personaggio." },
          justification: { type: Type.STRING },
          unhinged: { type: Type.STRING },
          caption: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array di stringhe senza il simbolo #" },
          wikiSearchTerm: { type: Type.STRING, description: "Nome esatto della pagina Wikipedia (in inglese) per recuperare la foto. Preferisci il nome dell'attore se il personaggio non ha una pagina dedicata. Es: 'Leighton Meester' invece di 'Blair Waldorf'." },
          auraColor: { type: Type.STRING, description: "Un codice colore HEX che rappresenta la sua aura (es. #000000 per dark, #FFB6C1 per soft)." },
          vibeScore: { type: Type.STRING, description: "Una percentuale ironica della sua vibe, es. '100% Main Character Energy' o '99% Dissociato/a'." }
        },
        required: ["character", "mediaSource", "justification", "unhinged", "caption", "tags", "wikiSearchTerm", "auraColor", "vibeScore"]
      },
      temperature: 0.8,
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text) as QuizResult;
}
