import { GoogleGenAI, Modality } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";

export const generateCarouselImages = async (
  referenceImageFile: File,
  prompts: string[],
  generalPrompt: string,
  selectedStyle: string
): Promise<(string | null)[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const base64ImageData = await fileToBase64(referenceImageFile);
    const mimeType = referenceImageFile.type;

    const imageGenerationPromises = prompts.map(userPrompt => {
      if (!userPrompt.trim()) {
        return Promise.resolve(null);
      }
      
      const styleInstruction = selectedStyle ? `**Estilo de Arte:** ${selectedStyle}.` : '';
      const generalInstruction = generalPrompt ? `**Instruções Gerais de Cena:** ${generalPrompt}.` : '';

      const fullPrompt = `**Tarefa Crítica:** Gere uma nova imagem.
**Requisito Obrigatório:** A imagem de saída DEVE ter exatamente a dimensão de 1080 pixels de largura por 1350 pixels de altura (proporção 4:5, formato retrato vertical). Este é o requisito mais importante.
**Instruções:** Use a imagem fornecida apenas como referência de estilo artístico e para o personagem principal. O personagem e o estilo devem ser consistentes em todas as imagens.
${generalInstruction}
${styleInstruction}
**Descrição da Cena Específica:** Crie uma cena baseada na seguinte descrição: "${userPrompt}". Altere a pose e o cenário conforme a descrição, mas mantenha o personagem e o estilo.
**Lembre-se, a dimensão 1080x1350 é inegociável.**`;

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
    
    if (prompts.some(p => p.trim()) && results.every(r => r === null)) {
      throw new Error('A IA não retornou nenhuma imagem. Tente refinar suas descrições.');
    }

    return results;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('A chave da API é inválida. Verifique a configuração.');
        }
        if (error.message.includes('quota')) {
            throw new Error('A cota da API foi excedida. Por favor, tente novamente mais tarde.');
        }
        throw error;
    }
    throw new Error('Falha ao gerar as imagens. Verifique o console para mais detalhes.');
  }
};


export const editCarouselImage = async (
  base64Url: string,
  editPrompt: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const [header, base64ImageData] = base64Url.split(',');
    const mimeTypeMatch = header.match(/data:(.*);base64/);
    if (!mimeTypeMatch) {
      throw new Error("Could not determine mime type from base64 URL.");
    }
    const mimeType = mimeTypeMatch[1];
    
    const response = await ai.models.generateContent({
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
            text: `Aplique a seguinte edição na imagem: "${editPrompt}"`,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }
    throw new Error("A IA não retornou uma imagem editada.");

  } catch (error) {
    console.error("Error editing image with Gemini API:", error);
     if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('A chave da API é inválida. Verifique a configuração.');
        }
        throw error;
    }
    throw new Error('Falha ao editar a imagem.');
  }
};


export const generateCarouselVideos = async (
  referenceImageFile: File,
  prompts: string[],
  generalPrompt: string,
  selectedStyle: string,
  withSpeech: boolean
): Promise<(string | null)[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64ImageData = await fileToBase64(referenceImageFile);
    const mimeType = referenceImageFile.type;

    const videoGenerationPromises = prompts.map(async (userPrompt) => {
      if (!userPrompt.trim()) {
        return Promise.resolve(null);
      }

      const styleInstruction = selectedStyle ? `**Estilo de Arte:** ${selectedStyle}.` : '';
      const generalInstruction = generalPrompt ? `**Instruções Gerais de Cena:** ${generalPrompt}.` : '';
      const speechInstruction = withSpeech
        ? '**Instrução de Áudio:** O vídeo deve ter uma narração clara em Português do Brasil descrevendo a cena solicitada.'
        : '**Instrução de Áudio:** O vídeo NÃO DEVE conter falas ou narração. Apenas sons ambientes ou trilha sonora são permitidos.';

      const fullPrompt = `**Tarefa:** Gere um vídeo curto (entre 5 e 10 segundos).
**Instruções de Estilo:** Use a imagem fornecida como referência de estilo artístico e para o personagem principal. O personagem e o estilo devem ser consistentes.
${generalInstruction}
${styleInstruction}
${speechInstruction}
**Descrição da Cena Específica:** Crie uma cena de vídeo animada baseada na seguinte descrição: "${userPrompt}".`;
      
      try {
        let operation = await ai.models.generateVideos({
          model: 'veo-2.0-generate-001',
          prompt: fullPrompt,
          image: {
            imageBytes: base64ImageData,
            mimeType: mimeType,
          },
          config: {
            numberOfVideos: 1
          }
        });

        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
          console.error(`Nenhum link de download para o prompt: "${userPrompt}"`);
          return null;
        }

        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Falha ao baixar o vídeo: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
      } catch (err) {
        console.error(`Erro ao gerar vídeo para o prompt: "${userPrompt}"`, err);
        return null;
      }
    });

    const results = await Promise.all(videoGenerationPromises);
    
    if (prompts.some(p => p.trim()) && results.every(r => r === null)) {
      throw new Error('A IA não retornou nenhum vídeo. Tente refinar suas descrições ou aguarde alguns minutos, o serviço pode estar ocupado.');
    }
    
    return results;

  } catch (error) {
    console.error("Erro ao chamar a API Gemini para vídeos:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('A chave da API é inválida. Verifique a configuração.');
        }
        throw error;
    }
    throw new Error('Falha ao gerar os vídeos. Verifique o console para mais detalhes.');
  }
};

export const generateSinglePost = async (
  referenceImageFile: File,
  inputText: string,
  platform: string,
  style: string
): Promise<{ text: string, images: (string | null)[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64ImageData = await fileToBase64(referenceImageFile);
    const mimeType = referenceImageFile.type;

    // 1. Text Generation
    const platformConstraints = {
      'X': 'Otimize para o formato do X (antigo Twitter), com no máximo 280 caracteres. Use hashtags relevantes.',
      'Instagram': 'Formate para uma legenda de Instagram. Use quebras de linha para legibilidade e inclua hashtags relevantes no final.',
      'Facebook': 'Crie um post para Facebook, que pode ser um pouco mais longo e narrativo. Use emojis para engajamento.',
      'LinkedIn': 'Adote um tom profissional para o LinkedIn. Estruture o texto com parágrafos curtos e talvez bullet points.',
    };
    
    const textRewritePrompt = `Você é um especialista em marketing digital e social media. Sua tarefa é reescrever o texto a seguir para ser postado no ${platform}.
**Instruções:**
1. **Plataforma:** ${platform}. ${platformConstraints[platform as keyof typeof platformConstraints] || ''}
2. **Tom de Voz:** O tom deve ser **${style}**. Se o estilo for "Padrão", analise o tom do rascunho e mantenha-o.
3. **Objetivo:** Otimizar o texto para clareza, engajamento e impacto, mantendo a mensagem central do rascunho original.

**Rascunho Original:**
---
${inputText}
---

**Texto Otimizado (responda APENAS com o texto final, sem introduções, despedidas ou formatação markdown como **):**`;

    const textGenerationPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: textRewritePrompt,
    });

    // 2. Image Generation
    const imageGenerationPrompt = `**Tarefa Crítica:** Gere uma imagem visualmente atraente para um post de mídia social.
**Requisito Obrigatório:** A imagem de saída DEVE ter a proporção de 1:1 (quadrada), com 1080x1080 pixels.
**Instruções:**
1. **Referência de Estilo:** Use a imagem fornecida como referência para o estilo artístico, paleta de cores e o personagem principal. A consistência é crucial.
2. **Contexto do Post:** O texto do post é sobre o seguinte: "${inputText}".
3. **Cena a ser Criada:** Crie uma cena que capture a essência da mensagem do texto. Se o texto descreve uma ação, mostre-a. Se é conceitual, crie uma metáfora visual.
**Lembre-se, a proporção 1:1 (1080x1080 pixels) é inegociável.**`;
    
    const imageGenerationPromises = Array(3).fill(0).map(() => 
      ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: [
            { inlineData: { data: base64ImageData, mimeType: mimeType } },
            { text: imageGenerationPrompt },
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
        console.error('Error generating a single post image:', err);
        return null;
      })
    );
    
    const [textResponse, ...imageResults] = await Promise.all([
        textGenerationPromise,
        ...imageGenerationPromises
    ]);

    const generatedText = textResponse.text;
    
    if (!generatedText && imageResults.every(r => r === null)) {
         throw new Error('A IA não conseguiu gerar texto ou imagens. Tente refinar sua ideia.');
    }

    return { text: generatedText, images: imageResults };

  } catch (error) {
    console.error("Error calling Gemini API for single post:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('A chave da API é inválida. Verifique a configuração.');
        }
        throw error;
    }
    throw new Error('Falha ao gerar o post. Verifique o console para mais detalhes.');
  }
};