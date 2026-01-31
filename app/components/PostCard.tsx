'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { lt } from 'date-fns/locale';

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
    <Link
      href={`/history/${id}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
    >
      <div className="flex gap-4 p-4">
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
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm text-gray-900 line-clamp-2">{truncatedText}</p>
            {isFavorite === 1 && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-500 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
      </div>
    </Link>
  );
}
