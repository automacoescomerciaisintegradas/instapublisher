import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getEmbedding(text: string): Promise<number[]> {
  if (!ai) throw new Error("Gemini API Key not configured");

  const response = await ai.models.embedContent({
    model: "gemini-embedding-2-preview",
    contents: [{
      parts: [{ text }],
    }],
  });

  const values = response.embeddings?.[0]?.values;
  if (!values) throw new Error("Failed to generate embedding values");
  return values;
}

export async function describeContent(
  content: string, 
  mimeType: string, 
  type: 'image' | 'video'
): Promise<string> {
  if (!ai) throw new Error("Gemini API Key not configured");

  const prompt = type === 'image' 
    ? "Descreva esta imagem em detalhes para fins de busca semântica." 
    : "Descreva o conteúdo deste vídeo em detalhes para fins de busca semântica.";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: content, mimeType } },
        { text: prompt }
      ]
    }
  });

  return response.text || "";
}
