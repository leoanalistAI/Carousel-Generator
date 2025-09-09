import React, { useState } from 'react';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import { DownloadIcon } from './icons/DownloadIcon';
import { PdfIcon } from './icons/PdfIcon';
import { ZipIcon } from './icons/ZipIcon';

interface CarouselDisplayProps {
  imageUrls: (string | null)[];
  isLoading: boolean;
  error: string | null;
  prompts: string[];
}

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
    <p className="text-gray-400">Gerando seu carrossel...</p>
    <p className="text-sm text-gray-500 text-center">Isso pode levar alguns instantes.</p>
  </div>
);

const GenerationError: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/50 rounded-lg p-2 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xs text-red-400 mt-2">Falha ao gerar</p>
    </div>
);


export const CarouselDisplay: React.FC<CarouselDisplayProps> = ({ imageUrls, isLoading, error, prompts }) => {
  const [isZipping, setIsZipping] = useState(false);
  const [isPdfing, setIsPdfing] = useState(false);

  const hasContent = imageUrls.length > 0;
  const hasSuccessfulGenerations = hasContent && imageUrls.some(url => url !== null);

  const handleZipDownload = async () => {
    if (!hasSuccessfulGenerations) return;
    setIsZipping(true);
    try {
        const zip = new JSZip();
        const validImages = imageUrls.map((url, index) => ({ url, index })).filter(item => item.url !== null);

        await Promise.all(validImages.map(async (item) => {
            const response = await fetch(item.url!);
            const blob = await response.blob();
            zip.file(`card-${item.index + 1}.png`, blob);
        }));

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'carrossel-gerado.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (err) {
        console.error("Failed to create ZIP file", err);
    } finally {
        setIsZipping(false);
    }
  };

  const handlePdfDownload = async () => {
    if (!hasSuccessfulGenerations) return;
    setIsPdfing(true);
    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [1080, 1920]
        });

        const validUrls = imageUrls.filter((url): url is string => url !== null);

        validUrls.forEach((url, index) => {
            if (index > 0) {
                pdf.addPage([1080, 1920], 'portrait');
            }
            pdf.addImage(url, 'PNG', 0, 0, 1080, 1920, undefined, 'FAST');
        });

        pdf.save('carrossel-gerado.pdf');
    } catch (err) {
        console.error("Failed to create PDF file", err);
    } finally {
        setIsPdfing(false);
    }
  };


  return (
    <div className="flex flex-col w-full h-full min-h-[30rem] bg-gray-900 rounded-lg p-4">
      {isLoading && <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>}
      
      {!isLoading && error && (
        <div className="flex-grow flex items-center justify-center">
            <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">
              <p className="font-bold">Ocorreu um erro</p>
              <p className="text-sm">{error}</p>
            </div>
        </div>
      )}

      {!isLoading && !error && !hasContent && (
        <div className="flex-grow flex items-center justify-center text-center text-gray-500">
          <p>Seus cards gerados aparecerão aqui.</p>
        </div>
      )}

      {!isLoading && !error && hasContent && !hasSuccessfulGenerations && (
         <div className="flex-grow flex items-center justify-center">
            <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">
              <p className="font-bold">Falha Total</p>
              <p className="text-sm">Nenhuma imagem pôde ser gerada. Tente novamente ou ajuste suas descrições.</p>
            </div>
         </div>
      )}

      {!isLoading && !error && hasSuccessfulGenerations && (
          <>
            <div className="w-full flex justify-end items-center gap-3 mb-4">
                <button
                    onClick={handlePdfDownload}
                    disabled={isPdfing || isZipping}
                    className="flex items-center justify-center gap-2 bg-red-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
                    aria-label="Baixar todas as imagens como PDF"
                >
                    <PdfIcon />
                    {isPdfing ? 'Gerando...' : 'Baixar PDF'}
                </button>
                <button
                    onClick={handleZipDownload}
                    disabled={isZipping || isPdfing}
                    className="flex items-center justify-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
                    aria-label="Baixar todas as imagens como arquivo ZIP"
                >
                    <ZipIcon />
                    {isZipping ? 'Compactando...' : 'Baixar ZIP'}
                </button>
            </div>
            <div className="w-full h-full overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {prompts.map((prompt, index) => {
                        if (!prompt.trim()) return null;
                        
                        const url = imageUrls[index];

                        return (
                            <div key={index} className="aspect-[9/16] bg-gray-800 rounded-lg flex items-center justify-center shadow-md">
                                {url ? (
                                    <div className="group relative w-full h-full">
                                        <img 
                                            src={url} 
                                            alt={`Imagem Gerada ${index + 1}`} 
                                            className="w-full h-full object-cover rounded-lg" 
                                        />
                                        <a
                                            href={url}
                                            download={`card-gerado-${index + 1}.png`}
                                            className="absolute bottom-2 right-2 bg-green-600 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 focus:opacity-100"
                                            aria-label={`Baixar Imagem ${index + 1}`}
                                        >
                                            <DownloadIcon />
                                        </a>
                                    </div>
                                ) : (
                                <GenerationError />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
      )}
    </div>
  );
};