import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserPosts } from '@/lib/posts/queries';
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { PostHistoryList } from '@/app/components/PostHistoryList';
import { HistoryControls } from '@/app/components/HistoryControls';

export default async function HistoryPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; favorites?: string }>
}) {
  const params = await searchParams;
  const searchQuery = params.search || '';
  const favoritesOnly = params.favorites === 'true';

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

  const { posts, nextCursor } = await getUserPosts(
    dbUser.id,
    undefined, // cursor
    searchQuery || undefined,
    favoritesOnly
  );

  // Serialize dates to strings for client component
  const serializedPosts = posts.map(post => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Mano įrašai</h1>
          <p className="text-gray-600">
            Peržiūrėkite visus sugeneruotus įrašus
          </p>
        </div>

        <HistoryControls
          initialSearch={searchQuery}
          initialFavorites={favoritesOnly}
        />

        <PostHistoryList
          initialPosts={serializedPosts}
          initialCursor={nextCursor}
          searchQuery={searchQuery}
          favoritesOnly={favoritesOnly}
        />
      </div>
    </div>
  );
}
