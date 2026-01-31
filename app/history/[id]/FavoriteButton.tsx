'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';

interface FavoriteButtonProps {
  postId: number;
  initialIsFavorite: boolean;
}

export default function FavoriteButton({ postId, initialIsFavorite }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();

  const handleToggleFavorite = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/favorite`, {
          method: 'PATCH',
        });

        if (!response.ok) {
          throw new Error('Failed to toggle favorite');
        }

        const data = await response.json();
        setIsFavorite(data.isFavorite);
        toast.success(data.isFavorite ? 'Pridėta prie mėgstamų' : 'Pašalinta iš mėgstamų');
      } catch (error) {
        toast.error('Nepavyko atnaujinti mėgstamiausių');
        console.error('Toggle favorite error:', error);
      }
    });
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isPending}
      className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-yellow-500 transition-colors disabled:opacity-50"
      title={isFavorite ? 'Pašalinti iš mėgstamų' : 'Pridėti prie mėgstamų'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-6 w-6 ${isFavorite ? 'text-yellow-500' : ''}`}
        viewBox="0 0 20 20"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={isFavorite ? 0 : 1.5}
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </button>
  );
}
