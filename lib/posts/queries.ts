import { eq, isNull, desc, lt, and, ilike, or } from 'drizzle-orm';
import { db } from '@/app/db';
import { posts, users, type GenerationConfig } from '@/app/db/schema';

// Pagination constant
const PAGE_SIZE = 20;

// Post type (inferred from schema)
export type Post = typeof posts.$inferSelect;

/**
 * Get user's posts with cursor-based pagination, search, and favorites filter
 *
 * @param userId - The user's ID
 * @param cursor - Optional cursor (last post ID from previous page)
 * @param search - Optional search query (searches in post text)
 * @param favoritesOnly - Optional filter for favorites only
 * @returns Posts array and next cursor (null if no more pages)
 */
export async function getUserPosts(
  userId: number,
  cursor?: number,
  search?: string,
  favoritesOnly?: boolean
): Promise<{ posts: Post[]; nextCursor: number | null }> {
  // Build conditions array
  const conditions = [
    eq(posts.userId, userId),
    isNull(posts.deletedAt)
  ];

  // Add cursor condition (id < cursor for DESC ordering)
  if (cursor !== undefined) {
    conditions.push(lt(posts.id, cursor));
  }

  // Add favorites filter
  if (favoritesOnly === true) {
    conditions.push(eq(posts.isFavorite, 1));
  }

  // Add search filter (case-insensitive search in post text)
  if (search && search.trim().length > 0) {
    conditions.push(ilike(posts.text, `%${search.trim()}%`));
  }

  // Query with PAGE_SIZE + 1 to detect if more pages exist
  const results = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.id)) // Newest first
    .limit(PAGE_SIZE + 1);

  // Check if more pages exist
  const hasMore = results.length > PAGE_SIZE;

  // Return only PAGE_SIZE posts
  const postsToReturn = hasMore ? results.slice(0, PAGE_SIZE) : results;

  // Next cursor is the last post's ID if more exist
  const nextCursor = hasMore && postsToReturn.length > 0
    ? postsToReturn[postsToReturn.length - 1].id
    : null;

  return {
    posts: postsToReturn,
    nextCursor
  };
}

/**
 * Get a single post by ID
 *
 * Security: Only returns post if it belongs to the user
 *
 * @param postId - The post ID
 * @param userId - The user's ID (for authorization)
 * @returns The post or null if not found
 */
export async function getPostById(
  postId: number,
  userId: number
): Promise<Post | null> {
  const result = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.id, postId),
        eq(posts.userId, userId),
        isNull(posts.deletedAt)
      )
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new post
 *
 * @param userId - The user's ID
 * @param text - The generated post text
 * @param imageUrl - Optional image URL (from Supabase Storage)
 * @param config - Generation configuration (industry, tone, etc.)
 * @returns The new post ID
 */
export async function createPost(
  userId: number,
  text: string,
  imageUrl: string | null,
  config: GenerationConfig
): Promise<{ id: number }> {
  const result = await db
    .insert(posts)
    .values({
      userId,
      text,
      imageUrl,
      config,
      isFavorite: 0
    })
    .returning({ id: posts.id });

  return result[0];
}

/**
 * Toggle favorite status for a post
 *
 * Security: Only toggles if post belongs to user
 *
 * @param postId - The post ID
 * @param userId - The user's ID (for authorization)
 * @returns The new favorite status (true if favorited, false if unfavorited)
 */
export async function toggleFavorite(
  postId: number,
  userId: number
): Promise<boolean> {
  // First, get current favorite status
  const post = await getPostById(postId, userId);

  if (!post) {
    throw new Error('Post not found or access denied');
  }

  // Toggle the favorite status (0 -> 1, 1 -> 0)
  const newFavoriteValue = post.isFavorite === 1 ? 0 : 1;

  await db
    .update(posts)
    .set({ isFavorite: newFavoriteValue })
    .where(
      and(
        eq(posts.id, postId),
        eq(posts.userId, userId)
      )
    );

  return newFavoriteValue === 1;
}

/**
 * Soft delete a post
 *
 * Security: Only deletes if post belongs to user
 *
 * @param postId - The post ID
 * @param userId - The user's ID (for authorization)
 */
export async function softDeletePost(
  postId: number,
  userId: number
): Promise<void> {
  await db
    .update(posts)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(posts.id, postId),
        eq(posts.userId, userId),
        isNull(posts.deletedAt) // Only delete if not already deleted
      )
    );
}
