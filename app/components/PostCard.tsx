'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { lt } from 'date-fns/locale';
import { FavoriteButton } from './FavoriteButton';

interface PostCardProps {
  id: number;
  text: string;
  imageUrl: string | null;
  createdAt: Date | string;
  isFavorite: number;
}

export function PostCard({ id, text, imageUrl, createdAt, isFavorite }: PostCardProps) {
  // Format date as relative time in Lithuanian
  const formattedDate = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: lt,
  });

  // Truncate text to ~100 characters
  const truncatedText = text.length > 100 ? text.slice(0, 100) + '...' : text;

  return (
    <div className="relative bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 overflow-hidden">
      <Link
        href={`/history/${id}`}
        className="block p-4"
      >
        <div className="flex gap-4">
          {/* Thumbnail */}
          {imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={imageUrl}
                alt="Post thumbnail"
                className="w-16 h-16 object-cover rounded"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 pr-10">
            <p className="text-sm text-gray-900 line-clamp-2 mb-2">{truncatedText}</p>
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
        </div>
      </Link>

      {/* Favorite button - positioned absolutely to prevent link click */}
      <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
        <FavoriteButton
          postId={id}
          isFavorite={isFavorite === 1}
        />
      </div>
    </div>
  );
}
