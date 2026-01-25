'use client';

import toast from 'react-hot-toast';

interface Props {
  onCopy: () => Promise<void> | void;
  onRegenerate: () => void;
  canCopy: boolean;
  canRegenerate: boolean;
  isLoading: boolean;
}

export function ActionButtons({ onCopy, onRegenerate, canCopy, canRegenerate, isLoading }: Props) {
  const handleCopy = async () => {
    try {
      await onCopy();
      toast.success('Nukopijuota!');
    } catch {
      toast.error('Kopijavimo klaida');
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 p-4 bg-white border-t shadow-lg z-50">
      <div className="max-w-2xl mx-auto flex gap-2">
        <button
          onClick={handleCopy}
          disabled={!canCopy || isLoading}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Kopijuoti
        </button>
        <button
          onClick={onRegenerate}
          disabled={!canRegenerate || isLoading}
          className="py-3 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Generuoti iš naujo
        </button>
      </div>
    </div>
  );
}
