import React, { useState, useEffect } from 'react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (editPrompt: string) => Promise<void>;
  imageUrl: string | null;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, onApply, imageUrl }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setEditPrompt('');
      setIsEditing(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || isEditing) return;

    setIsEditing(true);
    setError(null);
    try {
      await onApply(editPrompt);
      onClose(); // Close modal on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setError(errorMessage);
    } finally {
      setIsEditing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Editar Imagem</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fechar modal de edição"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="aspect-[4/5] bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt="Imagem para editar" className="w-full h-full object-contain" />
            ) : (
              <p className="text-gray-500">Nenhuma imagem selecionada.</p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col justify-between">
            <div>
                <label htmlFor="edit-prompt" className="font-semibold text-gray-300 mb-2 block">
                    O que você quer mudar?
                </label>
                <textarea
                    id="edit-prompt"
                    rows={5}
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 placeholder-gray-500 resize-none"
                    placeholder="Ex: adicione um chapéu de sol no personagem, mude a cor do fundo para verde..."
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    disabled={isEditing}
                />
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
            <div className="flex gap-4 mt-4">
                <button 
                    type="button" 
                    onClick={onClose} 
                    disabled={isEditing}
                    className="flex-1 bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    disabled={isEditing || !editPrompt.trim()}
                    className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed"
                >
                    {isEditing ? 'Aplicando...' : 'Aplicar Edição'}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
