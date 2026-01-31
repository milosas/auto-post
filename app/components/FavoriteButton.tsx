'use client';

import { useOptimistic, useTransition } from 'react';

interface FavoriteButtonProps {
  postId: number;
  isFavorite: boolean;
  onToggle?: (newState: boolean) => void;
}

export function FavoriteButton({ postId, isFavorite, onToggle }: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);

  const handleToggle = () => {
    startTransition(async () => {
      setOptimisticFavorite(!optimisticFavorite);

      try {
        const response = await fetch(`/api/posts/${postId}`, {
          method: 'PATCH',
        });

        if (!response.ok) {
          // Revert on error (optimistic will sync on next render)
          console.error('Failed to toggle favorite');
        } else {
          const data = await response.json();
          onToggle?.(data.isFavorite);
        }
      } catch (error) {
        console.error('Network error:', error);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`p-2 rounded-full transition-colors ${
        optimisticFavorite
          ? 'text-yellow-500 hover:text-yellow-600'
          : 'text-gray-400 hover:text-gray-500'
      }`}
      aria-label={optimisticFavorite ? 'Pasalinti is megstamiausiu' : 'Prideti prie megstamiausiu'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={optimisticFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    </button>
  );
}
