import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPostById, toggleFavorite } from '@/lib/posts/queries';
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { formatDistanceToNow } from 'date-fns';
import { lt } from 'date-fns/locale';
import CopyButton from './CopyButton';
import FavoriteButton from './FavoriteButton';

export default async function PostDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Get internal user ID
  const [dbUser] = await db.select({ id: users.id }).from(users).where(eq(users.authId, user.id));
  if (!dbUser) {
    redirect('/sign-in');
  }

  const post = await getPostById(postId, dbUser.id);

  if (!post) {
    notFound();
  }

  // Format date
  const formattedDate = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: lt,
  });

  // Build regenerate URL with ALL config fields
  const regenerateUrl = `/?industry=${encodeURIComponent(post.config.industry)}&topic=${encodeURIComponent(post.config.topic)}&tone=${encodeURIComponent(post.config.tone)}&length=${post.config.length}&emoji=${post.config.emoji}&imageStyle=${encodeURIComponent(post.config.imageStyle || '')}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with navigation */}
        <div className="mb-6">
          <Link
            href="/history"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Atgal į sąrašą
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Įrašo peržiūra</h1>
            <FavoriteButton postId={post.id} initialIsFavorite={post.isFavorite === 1} />
          </div>
          <p className="text-gray-600 mt-2">{formattedDate}</p>
        </div>

        {/* Post content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Image */}
          {post.imageUrl && (
            <div className="w-full">
              <img
                src={post.imageUrl}
                alt="Post image"
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Text content */}
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Tekstas</h2>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-900">{post.text}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              <CopyButton text={post.text} />
              <Link
                href={regenerateUrl}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Regeneruoti
              </Link>
            </div>

            {/* Config details */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Konfigūracija</h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-600">Industrija</dt>
                  <dd className="font-medium">{post.config.industry || 'Nenurodyta'}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Tonas</dt>
                  <dd className="font-medium">{post.config.tone}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Ilgis</dt>
                  <dd className="font-medium">{post.config.length} žodžių</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Emoji</dt>
                  <dd className="font-medium">{post.config.emoji ? 'Taip' : 'Ne'}</dd>
                </div>
                {post.config.imageStyle && (
                  <div className="col-span-2">
                    <dt className="text-gray-600">Paveikslelio stilius</dt>
                    <dd className="font-medium">{post.config.imageStyle}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
