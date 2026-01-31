'use client';

import { useState } from 'react';
import { GenerationConfig } from '@/app/db/schema';

interface SavePostButtonProps {
  text: string;
  imageUrl?: string; // DALL-E temporary URL
  config: GenerationConfig;
  onSaved?: (postId: number) => void;
  disabled?: boolean;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function SavePostButton({ text, imageUrl, config, onSaved, disabled }: SavePostButtonProps) {
  const [state, setState] = useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setState('saving');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          dalleImageUrl: imageUrl,
          config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save post');
      }

      const data = await response.json();
      setState('saved');

      if (onSaved && data.postId) {
        onSaved(data.postId);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save post');
    }
  };

  // Button text based on state
  const getButtonText = () => {
    switch (state) {
      case 'saving':
        return 'Saugoma...';
      case 'saved':
        return 'Išsaugota!';
      case 'error':
        return 'Klaida - bandykite dar';
      default:
        return 'Išsaugoti įrašą';
    }
  };

  // Button styling based on state
  const getButtonClassName = () => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';

    switch (state) {
      case 'saving':
        return `${baseClasses} bg-gray-400 text-white cursor-wait`;
      case 'saved':
        return `${baseClasses} bg-green-500 text-white`;
      case 'error':
        return `${baseClasses} bg-red-500 text-white hover:bg-red-600`;
      default:
        return `${baseClasses} bg-green-600 hover:bg-green-700 text-white`;
    }
  };

  const isDisabled = disabled || state === 'saving' || state === 'saved';

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSave}
        disabled={isDisabled}
        className={getButtonClassName()}
      >
        {getButtonText()}
      </button>
      {errorMessage && state === 'error' && (
        <p className="text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
