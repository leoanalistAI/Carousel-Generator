
import React from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  imageUrl: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ imageUrl, onImageChange }) => {
  return (
    <div className="w-full">
      <label
        htmlFor="image-upload"
        className="relative flex justify-center items-center w-full h-64 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors duration-300 bg-gray-900"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Pré-visualização" className="object-contain h-full w-full rounded-lg" />
        ) : (
          <div className="text-center text-gray-500">
            <UploadIcon />
            <p className="mt-2">Clique ou arraste para enviar</p>
            <p className="text-sm">PNG, JPG, WEBP</p>
          </div>
        )}
        <input
          id="image-upload"
          type="file"
          className="sr-only"
          accept="image/png, image/jpeg, image/webp"
          onChange={onImageChange}
        />
      </label>
    </div>
  );
};
