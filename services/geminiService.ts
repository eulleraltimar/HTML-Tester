import { GoogleGenAI, Type } from "@google/genai";

export const generateSeoSuggestions = async (htmlContent: string) => {
  if (!process.env.API_KEY) {
    throw new Error("API Key não encontrada");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Use a faster model for text generation
  const modelId = "gemini-3-flash-preview";

  const prompt = `
    Analise o seguinte conteúdo HTML/texto.
    Identifique a palavra-chave principal ou tópico.
    Gere uma sugestão de título SEO que tenha entre 45 e 60 caracteres, com a palavra-chave no início.
    Gere uma sugestão de meta descrição que tenha entre 145 e 155 caracteres, com a palavra-chave no início e uma Chamada para Ação (CTA) no final.
    
    Conteúdo:
    ${htmlContent.substring(0, 5000)} // Truncar para evitar payloads excessivos
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                keyword: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING }
            },
            required: ["keyword", "title", "description"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Sem resposta da IA");
    
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};