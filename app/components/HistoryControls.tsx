'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { SearchBar } from './SearchBar';

interface HistoryControlsProps {
  initialSearch: string;
  initialFavorites: boolean;
}

export function HistoryControls({ initialSearch, initialFavorites }: HistoryControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/history?${params.toString()}`);
  }, [router, searchParams]);

  const handleSearch = useCallback((query: string) => {
    updateParams('search', query || null);
  }, [updateParams]);

  const handleFavoritesToggle = () => {
    updateParams('favorites', initialFavorites ? null : 'true');
  };

  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1">
        <SearchBar onSearch={handleSearch} />
      </div>
      <button
        onClick={handleFavoritesToggle}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          initialFavorites
            ? 'bg-yellow-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Megstamiausi
      </button>
    </div>
  );
}
