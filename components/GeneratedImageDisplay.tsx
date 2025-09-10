import React, { useState } from 'react';
import JSZip from 'jszip';
import { DownloadIcon } from './icons/DownloadIcon';
import { ZipIcon } from './icons/ZipIcon';
import { EditIcon } from './icons/EditIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface CarouselDisplayProps {
  imageUrls: (string | null)[];
  isLoading: boolean;
  error: string | null;
  prompts: string[];
  onEditRequest: (index: number) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="w-full aspect-[4/5] flex flex-col items-center justify-center gap-4">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
    <p className="text-gray-400">Gerando seu carrossel...</p>
    <p className="text-sm text-gray-500 text-center">Isso pode levar alguns instantes.</p>
  </div>
);

const GenerationError: React.FC<{ message: string }> = ({ message }) => (
    <div className="w-full aspect-[4/5] flex flex-col items-center justify-center bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="font-semibold text-red-300">Ocorreu um erro</p>
        <p className="text-sm text-red-400 mt-1">{message}</p>
    </div>
);

const Placeholder: React.FC = () => (
  <div className="w-full aspect-[4/5] flex flex-col items-center justify-center bg-gray-800/50 rounded-lg text-center p-4">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <p className="mt-4 font-semibold text-gray-400">Seu carrossel aparecerá aqui</p>
    <p className="text-sm text-gray-500">Preencha os campos e clique em "Gerar".</p>
  </div>
);

export const CarouselDisplay: React.FC<CarouselDisplayProps> = ({ imageUrls, isLoading, error, prompts, onEditRequest }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeImages = imageUrls.map((url, i) => ({ url, prompt: prompts[i], originalIndex: i })).filter(item => item.url);

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? activeImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === activeImages.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  const handleDownloadAllAsZip = async () => {
    const zip = new JSZip();
    for (let i = 0; i < activeImages.length; i++) {
        const item = activeImages[i];
        const response = await fetch(item.url!);
        const blob = await response.blob();
        zip.file(`card_${i + 1}.png`, blob);
    }
    zip.generateAsync({ type: 'blob' }).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'carrossel.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  };

  const renderContent = () => {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <GenerationError message={error} />;
    if (activeImages.length === 0) return <Placeholder />;

    const currentImage = activeImages[currentIndex];
    
    return (
      <div className="relative w-full aspect-[4/5] group">
          {/* Carousel Image */}
          <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative">
              <img src={currentImage.url!} alt={`Imagem gerada para: ${currentImage.prompt}`} className="w-full h-full object-cover" />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                  <button onClick={() => onEditRequest(currentImage.originalIndex)} className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-indigo-600 transition-colors" title="Editar Imagem">
                      <EditIcon />
                  </button>
                   <a href={currentImage.url!} download={`card_${currentIndex + 1}.png`} className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-indigo-600 transition-colors" title="Baixar Imagem">
                      <DownloadIcon />
                   </a>
              </div>
          </div>

          {/* Prompt Display */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 rounded-b-lg">
             <p className="text-sm text-white truncate" title={currentImage.prompt}>
              <strong>Card {currentIndex + 1}:</strong> {currentImage.prompt}
            </p>
          </div>

          {/* Navigation */}
          {activeImages.length > 1 && (
            <>
              <button onClick={prevSlide} className="absolute top-1/2 left-2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100">
                <ChevronLeftIcon />
              </button>
              <button onClick={nextSlide} className="absolute top-1/2 right-2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100">
                <ChevronRightIcon />
              </button>
            </>
          )}

           {/* Dot Indicators */}
           <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex justify-center py-2 space-x-2">
              {activeImages.map((_, slideIndex) => (
                <button
                  key={slideIndex}
                  onClick={() => goToSlide(slideIndex)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentIndex === slideIndex ? 'bg-indigo-500' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  aria-label={`Ir para o slide ${slideIndex + 1}`}
                />
              ))}
            </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col w-full items-center">
      <div className="w-full">
        {renderContent()}
      </div>
      {activeImages.length > 0 && !isLoading && !error && (
        <div className="flex justify-center gap-3 mt-12">
            <button onClick={handleDownloadAllAsZip} className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              <ZipIcon />
              Baixar .zip
            </button>
        </div>
      )}
    </div>
  );
};