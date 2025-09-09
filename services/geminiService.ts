import { GoogleGenAI, Modality } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";

export const generateCarouselImages = async (
  apiKey: string,
  referenceImageFile: File,
  prompts: string[],
  generalPrompt: string,
  selectedStyle: string
): Promise<(string | null)[]> => {
  try {
    if (!apiKey) {
      throw new Error("A chave da API do Gemini não foi fornecida.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const base64ImageData = await fileToBase64(referenceImageFile);
    const mimeType = referenceImageFile.type;

    const imageGenerationPromises = prompts.map(userPrompt => {
      if (!userPrompt.trim()) {
        return Promise.resolve(null);
      }
      
      const styleInstruction = selectedStyle ? `**Estilo de Arte:** ${selectedStyle}.` : '';
      const generalInstruction = generalPrompt ? `**Instruções Gerais de Cena:** ${generalPrompt}.` : '';

      const fullPrompt = `**Tarefa Crítica:** Gere uma nova imagem.
**Requisito Obrigatório:** A imagem de saída DEVE ter exatamente a dimensão de 1080 pixels de largura por 1920 pixels de altura (proporção 9:16, formato retrato vertical). Este é o requisito mais importante.
**Instruções:** Use a imagem fornecida apenas como referência de estilo artístico e para o personagem principal. O personagem e o estilo devem ser consistentes em todas as imagens.
${generalInstruction}
${styleInstruction}
**Descrição da Cena Específica:** Crie uma cena baseada na seguinte descrição: "${userPrompt}". Altere a pose e o cenário conforme a descrição, mas mantenha o personagem e o estilo.
**Lembre-se, a dimensão 1080x1920 é inegociável.**`;

      return ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64ImageData,
                mimeType: mimeType,
              },
            },
            {
              text: fullPrompt,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      }).then(response => {
        if (response.candidates && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return part.inlineData.data;
            }
          }
        }
        return null;
      }).catch(err => {
        console.error(`Error generating image for prompt: "${userPrompt}"`, err);
        return null;
      });
    });

    const results = await Promise.all(imageGenerationPromises);
    
    // Do not throw error if all prompts were empty
    if (prompts.some(p => p.trim()) && results.every(r => r === null)) {
      throw new Error('A IA não retornou nenhuma imagem. Tente refinar suas descrições.');
    }

    return results;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('A chave da API fornecida é inválida. Verifique a chave e tente novamente.');
        }
        if (error.message.includes('quota')) {
            throw new Error('A cota da API foi excedida. Por favor, tente novamente mais tarde.');
        }
        throw error;
    }
    throw new Error('Falha ao gerar as imagens. Verifique o console para mais detalhes.');
  }
};
