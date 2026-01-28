'use client';

import toast from 'react-hot-toast';

interface Props {
  onCopy: () => Promise<void> | void;
  onRegenerateText: () => void;
  onRegenerateImage: () => void;
  canCopy: boolean;
  canRegenerateText: boolean;
  canRegenerateImage: boolean;
  isLoadingText: boolean;
  isLoadingImage: boolean;
}

export function ActionButtons({
  onCopy,
  onRegenerateText,
  onRegenerateImage,
  canCopy,
  canRegenerateText,
  canRegenerateImage,
  isLoadingText,
  isLoadingImage
}: Props) {
  const handleCopy = async () => {
    try {
      await onCopy();
      toast.success('Nukopijuota!');
    } catch {
      toast.error('Kopijavimo klaida');
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        disabled={!canCopy || isLoadingText || isLoadingImage}
        className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Kopijuoti
      </button>
      <button
        onClick={onRegenerateText}
        disabled={!canRegenerateText || isLoadingText}
        className="py-3 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {isLoadingText ? 'Generuojama...' : 'Naujas įrašas'}
      </button>
      <button
        onClick={onRegenerateImage}
        disabled={!canRegenerateImage || isLoadingImage}
        className="py-3 px-4 border border-purple-300 text-purple-700 rounded-lg font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {isLoadingImage ? 'Generuojama...' : 'Naujas paveikslėlis'}
      </button>
    </div>
  );
}
