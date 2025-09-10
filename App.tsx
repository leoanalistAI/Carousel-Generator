import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { CarouselDisplay } from './components/GeneratedImageDisplay';
import { VideoDisplay } from './components/VideoDisplay';
import { SinglePostDisplay } from './components/SinglePostDisplay';
import { EditModal } from './components/EditModal';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { HomePage } from './components/HomePage';
import { HomeIcon } from './components/icons/HomeIcon';
import { generateCarouselImages, editCarouselImage, generateCarouselVideos, generateSinglePost } from './services/geminiService';

const stylePresets = [
  { name: 'Padrão (da imagem)', value: '' },
  { name: 'Ilustração Flat', value: 'flat illustration, vector art, minimalist' },
  { name: 'Arte 3D', value: '3D render, cinematic lighting, octane render, high detail' },
  { name: 'Aquarela', value: 'watercolor painting, soft edges, paper texture' },
  { name: 'Anime/Mangá', value: 'anime style, vibrant colors, dynamic lines, manga aesthetic' },
  { name: 'Pixel Art', value: 'pixel art, 16-bit, retro gaming style' },
];

const platforms = ['Instagram', 'Facebook', 'LinkedIn', 'X'];
const textStyles = ['Padrão', 'Formal', 'Profissional', 'Técnico', 'Amigável', 'Casual'];

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'generator'>('home');
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'singlePost'>('images');

  // Image Generation State
  const [imageReference, setImageReference] = useState<File | null>(null);
  const [imageReferenceUrl, setImageReferenceUrl] = useState<string | null>(null);
  const [imagePrompts, setImagePrompts] = useState<string[]>(Array(10).fill(''));
  const [generatedImageUrls, setGeneratedImageUrls] = useState<(string | null)[]>([]);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageGeneralPrompt, setImageGeneralPrompt] = useState<string>('');
  const [imageSelectedStyle, setImageSelectedStyle] = useState<string>(stylePresets[0].value);
  const [imagePromptInputMode, setImagePromptInputMode] = useState<'list' | 'bulk'>('list');
  const [imageBulkPrompt, setImageBulkPrompt] = useState<string>('');
  
  // Video Generation State
  const [videoReference, setVideoReference] = useState<File | null>(null);
  const [videoReferenceUrl, setVideoReferenceUrl] = useState<string | null>(null);
  const [videoPrompts, setVideoPrompts] = useState<string[]>(Array(10).fill(''));
  const [generatedVideoUrls, setGeneratedVideoUrls] = useState<(string | null)[]>([]);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoGeneralPrompt, setVideoGeneralPrompt] = useState<string>('');
  const [videoSelectedStyle, setVideoSelectedStyle] = useState<string>(stylePresets[0].value);
  const [videoPromptInputMode, setVideoPromptInputMode] = useState<'list' | 'bulk'>('list');
  const [videoBulkPrompt, setVideoBulkPrompt] = useState<string>('');
  const [withSpeech, setWithSpeech] = useState<boolean>(true);

  // Single Post Generation State
  const [singlePostReference, setSinglePostReference] = useState<File | null>(null);
  const [singlePostReferenceUrl, setSinglePostReferenceUrl] = useState<string | null>(null);
  const [singlePostInputText, setSinglePostInputText] = useState<string>('');
  const [singlePostPlatform, setSinglePostPlatform] = useState<string>('Instagram');
  const [singlePostTextStyle, setSinglePostTextStyle] = useState<string>('Padrão');
  const [generatedPostText, setGeneratedPostText] = useState<string>('');
  const [generatedPostImages, setGeneratedPostImages] = useState<(string | null)[]>([]);
  const [isSinglePostLoading, setIsSinglePostLoading] = useState<boolean>(false);
  const [singlePostError, setSinglePostError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editingSinglePostImageIndex, setEditingSinglePostImageIndex] = useState<number | null>(null);


  const handleModeSelect = (mode: 'images' | 'videos' | 'singlePost') => {
    setActiveTab(mode);
    setView('generator');
  };

  const handleImageRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageReference(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImageReferenceUrl(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoReference(file);
      const reader = new FileReader();
      reader.onloadend = () => { setVideoReferenceUrl(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSinglePostRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSinglePostReference(file);
      const reader = new FileReader();
      reader.onloadend = () => { setSinglePostReferenceUrl(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleImagePromptChange = (index: number, value: string) => {
    const newPrompts = [...imagePrompts];
    newPrompts[index] = value;
    setImagePrompts(newPrompts);
  };
  
  const handleImageBulkPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setImageBulkPrompt(e.target.value);
  };

  const switchImageInputMode = (mode: 'list' | 'bulk') => {
    if (mode === imagePromptInputMode) return;
    if (mode === 'bulk') {
      setImageBulkPrompt(imagePrompts.filter(p => p.trim()).join('\n---\n'));
    } else {
      const newPrompts = imageBulkPrompt.split(/\n---\n/).slice(0, 10);
      const paddedPrompts = Array(10).fill('');
      newPrompts.forEach((p, i) => paddedPrompts[i] = p.trim());
      setImagePrompts(paddedPrompts);
    }
    setImagePromptInputMode(mode);
  };
  
  const handleVideoPromptChange = (index: number, value: string) => {
    const newPrompts = [...videoPrompts];
    newPrompts[index] = value;
    setVideoPrompts(newPrompts);
  };
  
  const handleVideoBulkPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setVideoBulkPrompt(e.target.value);
  };

  const switchVideoInputMode = (mode: 'list' | 'bulk') => {
    if (mode === videoPromptInputMode) return;
    if (mode === 'bulk') {
      setVideoBulkPrompt(videoPrompts.filter(p => p.trim()).join('\n---\n'));
    } else {
      const newPrompts = videoBulkPrompt.split(/\n---\n/).slice(0, 10);
      const paddedPrompts = Array(10).fill('');
      newPrompts.forEach((p, i) => paddedPrompts[i] = p.trim());
      setVideoPrompts(paddedPrompts);
    }
    setVideoPromptInputMode(mode);
  };

  const handleGenerateImagesClick = useCallback(async () => {
    const finalPrompts = (imagePromptInputMode === 'list' ? imagePrompts : imageBulkPrompt.split(/\n---\n/)).filter(p => p.trim());
    if (!imageReference || finalPrompts.length === 0) {
      setImageError('Por favor, envie uma imagem de referência e preencha pelo menos uma descrição.');
      return;
    }
    setIsImageLoading(true);
    setImageError(null);
    setGeneratedImageUrls([]);
    try {
      const base64DataArray = await generateCarouselImages(imageReference, finalPrompts, imageGeneralPrompt, imageSelectedStyle);
      const imageUrls = base64DataArray.map(data => data ? `data:image/png;base64,${data}` : null);
      const displayPrompts = imagePromptInputMode === 'list' ? imagePrompts : imageBulkPrompt.split(/\n---\n/);
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
      setImageError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsImageLoading(false);
    }
  }, [imageReference, imagePrompts, imageBulkPrompt, imagePromptInputMode, imageGeneralPrompt, imageSelectedStyle]);

  const handleGenerateVideosClick = useCallback(async () => {
    const finalPrompts = (videoPromptInputMode === 'list' ? videoPrompts : videoBulkPrompt.split(/\n---\n/)).filter(p => p.trim());
    if (!videoReference || finalPrompts.length === 0) {
        setVideoError('Por favor, envie uma imagem de referência e preencha pelo menos uma descrição de vídeo.');
        return;
    }
    setIsVideoLoading(true);
    setVideoError(null);
    setGeneratedVideoUrls([]);
    try {
        const videoUrls = await generateCarouselVideos(videoReference, finalPrompts, videoGeneralPrompt, videoSelectedStyle, withSpeech);
        const displayPrompts = videoPromptInputMode === 'list' ? videoPrompts : videoBulkPrompt.split(/\n---\n/);
        const resultUrls = Array(displayPrompts.length).fill(null);
        let resultIndex = 0;
        for (let i = 0; i < displayPrompts.length; i++) {
            if (displayPrompts[i].trim() && resultIndex < videoUrls.length) {
                resultUrls[i] = videoUrls[resultIndex];
                resultIndex++;
            }
        }
        setGeneratedVideoUrls(resultUrls);
    } catch (err) {
        console.error(err);
        setVideoError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao gerar os vídeos.');
    } finally {
        setIsVideoLoading(false);
    }
  }, [videoReference, videoPrompts, videoBulkPrompt, videoPromptInputMode, videoGeneralPrompt, videoSelectedStyle, withSpeech]);

  const handleGenerateSinglePostClick = useCallback(async () => {
    if (!singlePostReference || !singlePostInputText.trim()) {
        setSinglePostError('Por favor, envie uma imagem de referência e escreva a ideia ou rascunho do post.');
        return;
    }
    setIsSinglePostLoading(true);
    setSinglePostError(null);
    setGeneratedPostText('');
    setGeneratedPostImages([]);
    try {
        const result = await generateSinglePost(singlePostReference, singlePostInputText, singlePostPlatform, singlePostTextStyle);
        setGeneratedPostText(result.text);
        setGeneratedPostImages(result.images.map(data => data ? `data:image/png;base64,${data}` : null));
    } catch (err) {
        console.error(err);
        setSinglePostError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao gerar o post.');
    } finally {
        setIsSinglePostLoading(false);
    }
}, [singlePostReference, singlePostInputText, singlePostPlatform, singlePostTextStyle]);


  const handleOpenEditModal = (index: number) => {
    setEditingImageIndex(index);
    setIsEditModalOpen(true);
  };

  const handleOpenSinglePostEditModal = (index: number) => {
    setEditingSinglePostImageIndex(index);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingImageIndex(null);
    setEditingSinglePostImageIndex(null);
  };

  const handleApplyEdit = async (editPrompt: string) => {
    if (editingImageIndex === null && editingSinglePostImageIndex === null) return;

    const isCarouselEdit = editingImageIndex !== null;
    const index = isCarouselEdit ? editingImageIndex : editingSinglePostImageIndex!;
    const imageUrls = isCarouselEdit ? generatedImageUrls : generatedPostImages;
    const setUrls = isCarouselEdit ? setGeneratedImageUrls : setGeneratedPostImages;

    const imageUrlToEdit = imageUrls[index];
    if (!imageUrlToEdit) throw new Error("Imagem original não encontrada para edição.");

    try {
      const editedImageBase64 = await editCarouselImage(imageUrlToEdit, editPrompt);
      const newImageUrl = `data:image/png;base64,${editedImageBase64}`;
      const newImageUrls = [...imageUrls];
      newImageUrls[index] = newImageUrl;
      setUrls(newImageUrls);
    } catch (err) {
      console.error("Failed to apply edit:", err);
      throw err;
    }
  };


  const hasActiveImagePrompt = imagePrompts.some(p => p.trim()) || imageBulkPrompt.trim() !== '';
  const hasActiveVideoPrompt = videoPrompts.some(p => p.trim()) || videoBulkPrompt.trim() !== '';
  const hasActiveSinglePost = singlePostReference && singlePostInputText.trim() !== '';
  const displayImagePrompts = imagePromptInputMode === 'list' ? imagePrompts : imageBulkPrompt.split(/\n---\n/);
  const displayVideoPrompts = videoPromptInputMode === 'list' ? videoPrompts : videoBulkPrompt.split(/\n---\n/);
  
  const TabButton: React.FC<{tabName: 'images' | 'videos' | 'singlePost', label: string}> = ({tabName, label}) => (
    <button 
        onClick={() => setActiveTab(tabName)}
        className={`px-4 py-2 text-lg font-semibold rounded-t-lg transition-colors duration-300 ${activeTab === tabName ? 'bg-gray-800/50 text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
    >
        {label}
    </button>
  );

  if (view === 'home') {
    return <HomePage onSelect={handleModeSelect} />;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto max-w-7xl">
          <header className="text-center mb-8 md:mb-12 relative">
             <button 
              onClick={() => setView('home')} 
              className="absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Voltar para a página inicial"
            >
              <HomeIcon />
              <span className="hidden sm:inline">Início</span>
            </button>
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              Criador de Conteúdo com IA
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
              Mantenha o estilo, crie novas cenas. Envie sua referência, descreva o que deseja e deixe a IA fazer a mágica.
            </p>
          </header>

          <div className="border-b border-gray-700 mb-8 flex justify-center">
            <TabButton tabName="images" label="Carrossel" />
            <TabButton tabName="videos" label="Vídeo" />
            <TabButton tabName="singlePost" label="Post Único" />
          </div>

          <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            {activeTab === 'images' && (
              <div className="flex flex-col gap-6 p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl">
                <div>
                  <label className="text-lg font-semibold mb-2 block text-gray-300">1. Imagem de Referência</label>
                  <ImageUploader imageUrl={imageReferenceUrl} onImageChange={handleImageRefChange} />
                </div>
                <div>
                  <label htmlFor="general-prompt-img" className="text-lg font-semibold mb-2 block text-gray-300">2. Descrição Geral (Estilo Principal)</label>
                  <textarea id="general-prompt-img" rows={3} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Personagem sorrindo, fundo com céu azul..." value={imageGeneralPrompt} onChange={(e) => setImageGeneralPrompt(e.target.value)} />
                </div>
                <div>
                    <label className="text-lg font-semibold mb-3 block text-gray-300">3. Predefinição de Estilo</label>
                    <div className="flex flex-wrap gap-2">
                        {stylePresets.map(preset => (
                            <button key={preset.name} onClick={() => setImageSelectedStyle(preset.value)} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${imageSelectedStyle === preset.value ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                  <label className="text-lg font-semibold mb-2 block text-gray-300">4. Descreva os Cards</label>
                  <div className="flex border-b border-gray-700 mb-3">
                      <button onClick={() => switchImageInputMode('list')} className={`px-4 py-2 text-sm font-medium ${imagePromptInputMode === 'list' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>Lista</button>
                      <button onClick={() => switchImageInputMode('bulk')} className={`px-4 py-2 text-sm font-medium ${imagePromptInputMode === 'bulk' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>Texto Completo (separar com ---)</button>
                  </div>
                  <div className="flex flex-col gap-3 max-h-[20rem] overflow-y-auto pr-2">
                    {imagePromptInputMode === 'list' ? imagePrompts.map((p, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="pt-3 text-gray-400 font-semibold w-6 text-right">{index + 1}.</span>
                        <textarea rows={2} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500" placeholder={`Descrição para o card ${index + 1}...`} value={p} onChange={(e) => handleImagePromptChange(index, e.target.value)} />
                      </div>
                    )) : <textarea rows={10} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 font-mono text-sm" placeholder={`Card 1: Personagem acenando...\n---\nCard 2: Personagem lendo...`} value={imageBulkPrompt} onChange={handleImageBulkPromptChange} />}
                  </div>
                </div>
                <button onClick={handleGenerateImagesClick} disabled={isImageLoading || !imageReference || !hasActiveImagePrompt} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed">
                  <SparklesIcon /> {isImageLoading ? 'Gerando Carrossel...' : 'Gerar Carrossel'}
                </button>
              </div>
            )}
            {activeTab === 'videos' && (
              <div className="flex flex-col gap-6 p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl">
                <div>
                  <label className="text-lg font-semibold mb-2 block text-gray-300">1. Imagem de Referência</label>
                  <ImageUploader imageUrl={videoReferenceUrl} onImageChange={handleVideoRefChange} />
                </div>
                <div>
                  <label htmlFor="general-prompt-video" className="text-lg font-semibold mb-2 block text-gray-300">2. Descrição Geral (Estilo Principal)</label>
                  <textarea id="general-prompt-video" rows={3} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Personagem em um cenário de fantasia..." value={videoGeneralPrompt} onChange={(e) => setVideoGeneralPrompt(e.target.value)} />
                </div>
                 <div>
                    <label className="text-lg font-semibold mb-3 block text-gray-300">3. Predefinição de Estilo</label>
                    <div className="flex flex-wrap gap-2">
                        {stylePresets.map(preset => (
                            <button key={preset.name} onClick={() => setVideoSelectedStyle(preset.value)} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${videoSelectedStyle === preset.value ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-lg font-semibold mb-3 block text-gray-300">4. Áudio do Vídeo</label>
                    <div className="flex gap-2">
                        <button onClick={() => setWithSpeech(true)} className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${withSpeech ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Com Fala</button>
                        <button onClick={() => setWithSpeech(false)} className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${!withSpeech ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Sem Fala</button>
                    </div>
                </div>
                <div>
                  <label className="text-lg font-semibold mb-2 block text-gray-300">5. Descreva as Cenas</label>
                  <div className="flex border-b border-gray-700 mb-3">
                      <button onClick={() => switchVideoInputMode('list')} className={`px-4 py-2 text-sm font-medium ${videoPromptInputMode === 'list' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>Lista</button>
                      <button onClick={() => switchVideoInputMode('bulk')} className={`px-4 py-2 text-sm font-medium ${videoPromptInputMode === 'bulk' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>Texto Completo (separar com ---)</button>
                  </div>
                  <div className="flex flex-col gap-3 max-h-[15rem] overflow-y-auto pr-2">
                    {videoPromptInputMode === 'list' ? videoPrompts.map((p, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="pt-3 text-gray-400 font-semibold w-6 text-right">{index + 1}.</span>
                        <textarea rows={2} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500" placeholder={`Descrição para o vídeo ${index + 1}...`} value={p} onChange={(e) => handleVideoPromptChange(index, e.target.value)} />
                      </div>
                    )) : <textarea rows={10} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 font-mono text-sm" placeholder={`Vídeo 1: Close-up do personagem sorrindo...\n---\nVídeo 2: Câmera se afasta mostrando a paisagem...`} value={videoBulkPrompt} onChange={handleVideoBulkPromptChange} />}
                  </div>
                </div>
                <button onClick={handleGenerateVideosClick} disabled={isVideoLoading || !videoReference || !hasActiveVideoPrompt} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed">
                  <SparklesIcon /> {isVideoLoading ? 'Gerando Vídeos...' : 'Gerar Vídeos'}
                </button>
              </div>
            )}
            {activeTab === 'singlePost' && (
              <div className="flex flex-col gap-6 p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl">
                <div>
                  <label className="text-lg font-semibold mb-2 block text-gray-300">1. Imagem de Referência</label>
                  <ImageUploader imageUrl={singlePostReferenceUrl} onImageChange={handleSinglePostRefChange} />
                </div>
                 <div>
                    <label className="text-lg font-semibold mb-3 block text-gray-300">2. Plataforma de Destino</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {platforms.map(platform => (
                            <button key={platform} onClick={() => setSinglePostPlatform(platform)} className={`py-2 px-4 text-sm font-medium rounded-lg transition-colors ${singlePostPlatform === platform ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                {platform}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-lg font-semibold mb-3 block text-gray-300">3. Estilo do Texto</label>
                    <div className="flex flex-wrap gap-2">
                        {textStyles.map(style => (
                            <button key={style} onClick={() => setSinglePostTextStyle(style)} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${singlePostTextStyle === style ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                {style}
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                  <label htmlFor="single-post-prompt" className="text-lg font-semibold mb-2 block text-gray-300">4. Ideia ou Rascunho do Post</label>
                  <textarea id="single-post-prompt" rows={6} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500" placeholder="Digite aqui o texto base para seu post, ou apenas a ideia principal..." value={singlePostInputText} onChange={(e) => setSinglePostInputText(e.target.value)} />
                </div>
                <button onClick={handleGenerateSinglePostClick} disabled={isSinglePostLoading || !hasActiveSinglePost} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed">
                  <SparklesIcon /> {isSinglePostLoading ? 'Gerando Post...' : 'Gerar Post'}
                </button>
              </div>
            )}


            {/* Output Section */}
            <div className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl">
              {activeTab === 'images' && <>
                <h2 className="text-lg font-semibold mb-4 text-gray-300">Resultado do Carrossel</h2>
                <CarouselDisplay imageUrls={generatedImageUrls} isLoading={isImageLoading} error={imageError} prompts={displayImagePrompts} onEditRequest={handleOpenEditModal}/>
              </>}
              {activeTab === 'videos' && <>
                <h2 className="text-lg font-semibold mb-4 text-gray-300">Resultado dos Vídeos</h2>
                <VideoDisplay videoUrls={generatedVideoUrls} isLoading={isVideoLoading} error={videoError} prompts={displayVideoPrompts} />
              </>}
              {activeTab === 'singlePost' && <>
                <h2 className="text-lg font-semibold mb-4 text-gray-300">Resultado do Post</h2>
                <SinglePostDisplay 
                  text={generatedPostText} 
                  imageUrls={generatedPostImages} 
                  isLoading={isSinglePostLoading} 
                  error={singlePostError} 
                  onEditRequest={handleOpenSinglePostEditModal}
                />
              </>}
            </div>
          </main>
        </div>
      </div>
      <EditModal 
        isOpen={isEditModalOpen} 
        onClose={handleCloseEditModal} 
        onApply={handleApplyEdit} 
        imageUrl={
          editingImageIndex !== null ? generatedImageUrls[editingImageIndex] :
          editingSinglePostImageIndex !== null ? generatedPostImages[editingSinglePostImageIndex] : 
          null
        } 
      />
    </>
  );
};

export default App;