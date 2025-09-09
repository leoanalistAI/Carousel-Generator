import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { CarouselDisplay } from './components/GeneratedImageDisplay';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { generateCarouselImages } from './services/geminiService';

const stylePresets = [
  { name: 'Padrão (da imagem)', value: '' },
  { name: 'Ilustração Flat', value: 'flat illustration, vector art, minimalist' },
  { name: 'Arte 3D', value: '3D render, cinematic lighting, octane render, high detail' },
  { name: 'Aquarela', value: 'watercolor painting, soft edges, paper texture' },
  { name: 'Anime/Mangá', value: 'anime style, vibrant colors, dynamic lines, manga aesthetic' },
  { name: 'Pixel Art', value: 'pixel art, 16-bit, retro gaming style' },
];


const ApiKeySetup: React.FC<{ onKeySubmit: (key: string) => void }> = ({ onKeySubmit }) => {
    const [inputKey, setInputKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputKey.trim()) {
            onKeySubmit(inputKey.trim());
        }
    };
    
    const KeyIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
        </svg>
    );

    const InfoIcon = () => (
       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                        Configure sua API Key
                    </h1>
                    <p className="mt-3 text-gray-400">
                        Para usar o Criador de Carrossel, por favor, insira sua chave de API do Google Gemini.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                           <KeyIcon />
                        </div>
                        <input
                            type="password"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 placeholder-gray-500"
                            placeholder="Cole sua API Key aqui"
                            required
                            aria-label="Gemini API Key"
                        />
                    </div>
                    <div className="flex items-start bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-sm">
                        <InfoIcon />
                        <p className="ml-2 text-gray-400">
                           Sua chave será armazenada apenas na sessão do seu navegador. Ela não é salva em nenhum outro lugar.
                        </p>
                    </div>
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-600 transform hover:scale-105 active:scale-100"
                    >
                        Salvar e Continuar
                    </button>
                </form>
                 <div className="text-center mt-6">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        Não tem uma chave? Obtenha uma no Google AI Studio &rarr;
                    </a>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<string[]>(Array(10).fill(''));
  const [generatedImageUrls, setGeneratedImageUrls] = useState<(string | null)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generalPrompt, setGeneralPrompt] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>(stylePresets[0].value);
  const [promptInputMode, setPromptInputMode] = useState<'list' | 'bulk'>('list');
  const [bulkPrompt, setBulkPrompt] = useState<string>('');
  
  useEffect(() => {
    const storedKey = sessionStorage.getItem('gemini-api-key');
    if (storedKey) {
        setApiKey(storedKey);
    }
  }, []);

  const handleApiKeySubmit = (key: string) => {
      sessionStorage.setItem('gemini-api-key', key);
      setApiKey(key);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReferenceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePromptChange = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };
  
  const handleBulkPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBulkPrompt(e.target.value);
  };

  const switchInputMode = (mode: 'list' | 'bulk') => {
    if (mode === promptInputMode) return;

    if (mode === 'bulk') { // from list to bulk
      setBulkPrompt(prompts.filter(p=>p.trim()).join('\n---\n'));
    } else { // from bulk to list
      const newPrompts = bulkPrompt.split(/\n---\n/).slice(0, 10);
      const paddedPrompts = Array(10).fill('');
      newPrompts.forEach((p, i) => paddedPrompts[i] = p.trim());
      setPrompts(paddedPrompts);
    }
    setPromptInputMode(mode);
  };

  const handleGenerateClick = useCallback(async () => {
    if (!apiKey) {
      setError('A chave da API do Gemini não está configurada.');
      return;
    }

    const finalPrompts = (promptInputMode === 'list' 
        ? prompts 
        : bulkPrompt.split(/\n---\n/)
      ).filter(p => p.trim());

    if (!referenceImage || finalPrompts.length === 0) {
      setError('Por favor, envie uma imagem de referência e preencha pelo menos uma descrição.');
      return;
    }

    const displayPrompts = promptInputMode === 'list' ? prompts : bulkPrompt.split(/\n---\n/);

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrls([]);

    try {
      const base64DataArray = await generateCarouselImages(apiKey, referenceImage, finalPrompts, generalPrompt, selectedStyle);
      const imageUrls = base64DataArray.map(data => data ? `data:image/png;base64,${data}` : null);
      
      const resultUrls = Array(displayPrompts.length).fill(null);
      let resultIndex = 0;
      for (let i = 0; i < displayPrompts.length; i++) {
        if (displayPrompts[i].trim()) {
           if(resultIndex < imageUrls.length) {
              resultUrls[i] = imageUrls[resultIndex];
              resultIndex++;
           }
        }
      }

      setGeneratedImageUrls(resultUrls);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao gerar as imagens.';
      setError(errorMessage);
       if (errorMessage.includes('chave da API fornecida é inválida')) {
          sessionStorage.removeItem('gemini-api-key');
          setApiKey(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, referenceImage, prompts, bulkPrompt, promptInputMode, generalPrompt, selectedStyle]);
  
  const hasActivePrompt = prompts.some(p => p.trim()) || bulkPrompt.trim() !== '';

  const displayPrompts = promptInputMode === 'list' ? prompts : bulkPrompt.split(/\n---\n/);

  if (!apiKey) {
    return <ApiKeySetup onKeySubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="text-center mb-8 md:mb-12 relative">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            Criador de Cards para Carrossel
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
            Mantenha o estilo da sua ilustração, mas crie novas poses. Envie sua referência, descreva as cenas e deixe a IA fazer a mágica.
          </p>
          <button 
              onClick={() => {
                  sessionStorage.removeItem('gemini-api-key');
                  setApiKey(null);
              }}
              className="absolute top-0 right-0 -mt-2 sm:mt-0 text-gray-500 hover:text-white transition-colors text-xs flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded-full"
              title="Alterar API Key"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
              Alterar Chave
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="flex flex-col gap-6 p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl">
            <div>
              <label className="text-lg font-semibold mb-2 block text-gray-300">1. Imagem de Referência</label>
              <ImageUploader imageUrl={referenceImageUrl} onImageChange={handleImageChange} />
            </div>

            <div>
              <label htmlFor="general-prompt" className="text-lg font-semibold mb-2 block text-gray-300">
                2. Descrição Geral (Estilo Principal)
              </label>
              <textarea
                id="general-prompt"
                rows={3}
                className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 placeholder-gray-500 resize-none"
                placeholder="Ex: Personagem sorrindo, fundo com céu azul e nuvens..."
                value={generalPrompt}
                onChange={(e) => setGeneralPrompt(e.target.value)}
                aria-label="Descrição Geral para todos os cards"
              />
            </div>

            <div>
                <label className="text-lg font-semibold mb-3 block text-gray-300">3. Predefinição de Estilo</label>
                <div className="flex flex-wrap gap-2">
                    {stylePresets.map(preset => (
                        <button
                            key={preset.name}
                            onClick={() => setSelectedStyle(preset.value)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                                selectedStyle === preset.value
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>
            </div>

            <div>
              <label className="text-lg font-semibold mb-2 block text-gray-300">
                4. Descreva os Cards
              </label>
               <div className="flex border-b border-gray-700 mb-3">
                  <button onClick={() => switchInputMode('list')} className={`px-4 py-2 text-sm font-medium transition-colors ${promptInputMode === 'list' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                      Lista
                  </button>
                  <button onClick={() => switchInputMode('bulk')} className={`px-4 py-2 text-sm font-medium transition-colors ${promptInputMode === 'bulk' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                      Texto Completo (separar com ---)
                  </button>
              </div>

              <div className="flex flex-col gap-3 max-h-[20rem] overflow-y-auto pr-2">
                 {promptInputMode === 'list' ? (
                    prompts.map((p, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="pt-3 text-gray-400 font-semibold w-6 text-right">{index + 1}.</span>
                        <textarea
                          rows={2}
                          className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 placeholder-gray-500 resize-none"
                          placeholder={`Descrição para o card ${index + 1}...`}
                          value={p}
                          onChange={(e) => handlePromptChange(index, e.target.value)}
                          aria-label={`Descrição para o card ${index + 1}`}
                        />
                      </div>
                    ))
                ) : (
                    <textarea
                        rows={10}
                        className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 placeholder-gray-500 resize-none font-mono text-sm"
                        placeholder={`Card 1: Personagem acenando...\n---\nCard 2: Personagem lendo um livro...`}
                        value={bulkPrompt}
                        onChange={handleBulkPromptChange}
                        aria-label="Descrição de todos os cards em texto completo"
                    />
                )}
              </div>
            </div>
            <button
              onClick={handleGenerateClick}
              disabled={isLoading || !referenceImage || !hasActivePrompt}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100 disabled:transform-none"
            >
              <SparklesIcon />
              {isLoading ? 'Gerando Carrossel...' : 'Gerar Carrossel'}
            </button>
          </div>

          {/* Output Section */}
          <div className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4 text-gray-300">Resultado do Carrossel</h2>
            <CarouselDisplay imageUrls={generatedImageUrls} isLoading={isLoading} error={error} prompts={displayPrompts} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
