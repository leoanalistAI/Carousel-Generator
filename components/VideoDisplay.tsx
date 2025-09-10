import React, { useState } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface VideoDisplayProps {
  videoUrls: (string | null)[];
  isLoading: boolean;
  error: string | null;
  prompts: string[];
}

const LoadingSpinner: React.FC = () => (
  <div className="w-full aspect-[16/9] flex flex-col items-center justify-center gap-4 text-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
    <p className="text-gray-400 font-semibold mt-4">Gerando seus vídeos...</p>
    <p className="text-sm text-gray-500 max-w-xs">
      Este processo pode levar vários minutos. <br/>Sinta-se à vontade para tomar um café ☕
    </p>
  </div>
);

const GenerationError: React.FC<{ message: string }> = ({ message }) => (
    <div className="w-full aspect-[16/9] flex flex-col items-center justify-center bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="font-semibold text-red-300">Ocorreu um erro</p>
        <p className="text-sm text-red-400 mt-1">{message}</p>
    </div>
);

const Placeholder: React.FC = () => (
  <div className="w-full aspect-[16/9] flex flex-col items-center justify-center bg-gray-800/50 rounded-lg text-center p-4">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    <p className="mt-4 font-semibold text-gray-400">Seus vídeos aparecerão aqui</p>
    <p className="text-sm text-gray-500">Preencha os campos e clique em "Gerar".</p>
  </div>
);

export const VideoDisplay: React.FC<VideoDisplayProps> = ({ videoUrls, isLoading, error, prompts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeVideos = videoUrls.map((url, i) => ({ url, prompt: prompts[i], originalIndex: i })).filter(item => item.url);

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? activeVideos.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === activeVideos.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  const renderContent = () => {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <GenerationError message={error} />;
    if (activeVideos.length === 0) return <Placeholder />;

    const currentVideo = activeVideos[currentIndex];
    
    return (
      <div className="relative w-full aspect-[16/9] group">
          <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative">
              <video src={currentVideo.url!} className="w-full h-full object-cover" controls autoPlay loop muted playsInline />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                   <a href={currentVideo.url!} download={`video_${currentIndex + 1}.mp4`} className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-indigo-600 transition-colors" title="Baixar Vídeo">
                      <DownloadIcon />
                   </a>
              </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 rounded-b-lg">
             <p className="text-sm text-white truncate" title={currentVideo.prompt}>
              <strong>Vídeo {currentIndex + 1}:</strong> {currentVideo.prompt}
            </p>
          </div>
          {activeVideos.length > 1 && (
            <>
              <button onClick={prevSlide} className="absolute top-1/2 left-2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100">
                <ChevronLeftIcon />
              </button>
              <button onClick={nextSlide} className="absolute top-1/2 right-2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100">
                <ChevronRightIcon />
              </button>
            </>
          )}
           <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex justify-center py-2 space-x-2">
              {activeVideos.map((_, slideIndex) => (
                <button
                  key={slideIndex}
                  onClick={() => goToSlide(slideIndex)}
                  className={`w-2 h-2 rounded-full transition-colors ${ currentIndex === slideIndex ? 'bg-indigo-500' : 'bg-gray-600 hover:bg-gray-500' }`}
                  aria-label={`Ir para o vídeo ${slideIndex + 1}`}
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
    </div>
  );
};