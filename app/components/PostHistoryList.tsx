'use client';

import { useEffect, useState, useTransition } from 'react';
import { useInView } from 'react-intersection-observer';
import { PostCard } from './PostCard';

interface Post {
  id: number;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  isFavorite: number;
}

interface PostHistoryListProps {
  initialPosts: Post[];
  initialCursor: number | null;
  searchQuery: string;
  favoritesOnly: boolean;
}

export function PostHistoryList({ initialPosts, initialCursor, searchQuery, favoritesOnly }: PostHistoryListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [cursor, setCursor] = useState<number | null>(initialCursor);
  const [isPending, startTransition] = useTransition();
  const { ref, inView } = useInView();

  // Reset posts when search/filter changes (server already handled initial load)
  useEffect(() => {
    setPosts(initialPosts);
    setCursor(initialCursor);
  }, [searchQuery, favoritesOnly, initialPosts, initialCursor]);

  // Load more posts when the sentinel element comes into view
  useEffect(() => {
    if (inView && cursor !== null && !isPending) {
      startTransition(async () => {
        try {
          const params = new URLSearchParams();
          params.set('cursor', cursor.toString());
          if (searchQuery) params.set('search', searchQuery);
          if (favoritesOnly) params.set('favorites', 'true');

          const response = await fetch(`/api/posts?${params.toString()}`);

          if (!response.ok) {
            console.error('Failed to fetch more posts');
            return;
          }

          const data = await response.json();
          setPosts((prevPosts) => [...prevPosts, ...data.posts]);
          setCursor(data.nextCursor);
        } catch (error) {
          console.error('Error fetching more posts:', error);
        }
      });
    }
  }, [inView, cursor, isPending, searchQuery, favoritesOnly]);

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 mx-auto text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-600 text-lg mb-2">Neturite išsaugotų įrašų</p>
        <p className="text-gray-500 text-sm">
          Sugeneruokite įrašą ir išsaugokite!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Post cards */}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          id={post.id}
          text={post.text}
          imageUrl={post.imageUrl}
          createdAt={post.createdAt}
          isFavorite={post.isFavorite}
        />
      ))}

      {/* Loading indicator */}
      {isPending && (
        <div className="text-center py-4">
          <svg
            className="animate-spin h-8 w-8 mx-auto text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}

      {/* Sentinel element for infinite scroll */}
      {cursor !== null && <div ref={ref} className="h-4" />}

      {/* End of list message */}
      {cursor === null && !isPending && posts.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Nėra daugiau įrašų
        </div>
      )}
    </div>
  );
}
