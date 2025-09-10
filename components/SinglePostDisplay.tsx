import React, { useState } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { CopyIcon } from './icons/CopyIcon';
import { EditIcon } from './icons/EditIcon';

interface SinglePostDisplayProps {
  text: string;
  imageUrls: (string | null)[];
  isLoading: boolean;
  error: string | null;
  onEditRequest: (index: number) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="w-full flex flex-col items-center justify-center gap-4 py-8">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
    <p className="text-gray-400">Criando seu post...</p>
    <p className="text-sm text-gray-500 text-center">Isso pode levar alguns instantes.</p>
  </div>
);

const GenerationError: React.FC<{ message: string }> = ({ message }) => (
    <div className="w-full flex flex-col items-center justify-center bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="font-semibold text-red-300">Ocorreu um erro</p>
        <p className="text-sm text-red-400 mt-1">{message}</p>
    </div>
);

const Placeholder: React.FC = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/50 rounded-lg text-center p-4">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <p className="mt-4 font-semibold text-gray-400">Seu post completo aparecerá aqui</p>
    <p className="text-sm text-gray-500">Preencha os campos e clique em "Gerar".</p>
  </div>
);

// Helper function to render text with markdown-like formatting
const renderFormattedText = (rawText: string) => {
    if (!rawText) return null;
  
    return rawText.split('\n').map((line, index) => {
      // Handle empty lines which represent paragraph breaks
      if (line.trim() === '') {
        return <div key={index} className="h-4" aria-hidden="true"></div>;
      }
  
      // Handle subheadings: **A Subheading**
      const subheadingMatch = line.match(/^\*\*(.*)\*\*$/);
      if (subheadingMatch) {
        return (
          <h4 key={index} className="text-lg font-semibold text-gray-100 mt-4 mb-2">
            {subheadingMatch[1]}
          </h4>
        );
      }
  
      // Handle paragraphs with bold text: *this is bold*
      // Split the line by our bold marker, but keep the captured group
      const parts = line.split(/(\*.*?\*)/g).filter(Boolean);
  
      return (
        <p key={index} className="text-gray-300">
          {parts.map((part, partIndex) => {
            if (part.startsWith('*') && part.endsWith('*')) {
              // It's a bold part, remove asterisks and wrap in <strong>
              return <strong key={partIndex} className="font-bold text-white">{part.slice(1, -1)}</strong>;
            }
            // It's a regular text part
            return part;
          })}
        </p>
      );
    });
};

export const SinglePostDisplay: React.FC<SinglePostDisplayProps> = ({ text, imageUrls, isLoading, error, onEditRequest }) => {
  const [copySuccess, setCopySuccess] = useState('');
  const activeImages = imageUrls.filter(url => url !== null) as string[];

  const handleCopyText = () => {
    navigator.clipboard.writeText(text).then(() => {
        setCopySuccess('Copiado!');
        setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
        setCopySuccess('Falhou!');
        setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const renderContent = () => {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <GenerationError message={error} />;
    if (!text && activeImages.length === 0) return <Placeholder />;

    return (
      <div className="space-y-6">
        {text && (
            <div>
                <h3 className="text-md font-semibold text-gray-400 mb-2">Texto Sugerido</h3>
                <div className="relative bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <div>{renderFormattedText(text)}</div>
                    <button onClick={handleCopyText} className="absolute top-2 right-2 p-2 bg-gray-700/80 rounded-full text-white hover:bg-indigo-600 transition-colors" title="Copiar Texto">
                        {copySuccess ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <CopyIcon />}
                    </button>
                </div>
                 {copySuccess && <p className="text-right text-sm text-green-400 mt-1">{copySuccess}</p>}
            </div>
        )}
        {activeImages.length > 0 && (
            <div>
                 <h3 className="text-md font-semibold text-gray-400 mb-2">Imagens Sugeridas</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {activeImages.map((url, index) => (
                        <div key={index} className="relative w-full aspect-square group">
                            <img src={url} alt={`Sugestão de imagem ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                <button onClick={() => onEditRequest(index)} className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-indigo-600 transition-colors" title="Editar Imagem">
                                    <EditIcon />
                                </button>
                                <a href={url} download={`sugestao_${index + 1}.png`} className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-indigo-600 transition-colors" title="Baixar Imagem">
                                    <DownloadIcon />
                                </a>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col w-full">
        {renderContent()}
    </div>
  );
};