import React from 'react';
import { CarouselIcon } from './icons/CarouselIcon';
import { VideoIcon } from './icons/VideoIcon';
import { PostIcon } from './icons/PostIcon';

interface HomePageProps {
  onSelect: (mode: 'images' | 'videos' | 'singlePost') => void;
}

const SelectionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}> = ({ title, description, icon, onClick, disabled }) => {
  const baseClasses = "relative group flex flex-col items-center justify-center p-8 text-center bg-gray-800/50 backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:-translate-y-2";
  const disabledClasses = "opacity-50 cursor-not-allowed";
  const enabledClasses = "cursor-pointer animated-border";

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
      style={{ backgroundOrigin: 'border-box' }}
    >
      {disabled && (
        <span className="absolute top-3 right-3 bg-yellow-500 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
          Em Breve
        </span>
      )}
      <div className="mb-4 text-indigo-400 group-hover:text-indigo-300 transition-colors">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-4">
          Criador de Conteúdo com IA
        </h1>
        <p className="text-xl text-gray-400">O que você quer criar hoje?</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <SelectionCard
          title="Criar Carrossel"
          description="Gere sequências de imagens consistentes para posts de carrossel."
          icon={<CarouselIcon />}
          onClick={() => onSelect('images')}
        />
        <SelectionCard
          title="Criar Vídeo"
          description="Transforme suas ideias em vídeos curtos para Reels ou Shorts."
          icon={<VideoIcon />}
          onClick={() => onSelect('videos')}
        />
        <SelectionCard
          title="Criar Post Único"
          description="Desenvolva uma imagem única e impactante para seu feed."
          icon={<PostIcon />}
          onClick={() => onSelect('singlePost')}
          disabled={false}
        />
      </div>
    </div>
  );
};
