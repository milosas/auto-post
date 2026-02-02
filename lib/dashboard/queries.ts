import { eq, and, isNull, count, sql } from 'drizzle-orm';
import { db } from '@/app/db';
import { posts, usageLimits, subscriptions } from '@/app/db/schema';

// Dashboard stats type
export type DashboardStats = {
  generationsToday: number;
  totalPosts: number;
  favorites: number;
  subscription: {
    status: string;
    credits: number;
    plan?: string;
  } | null;
};

/**
 * Get dashboard statistics for a user
 *
 * Fetches all stats in parallel for optimal performance.
 * Always filters soft-deleted records (deletedAt IS NULL).
 *
 * @param userId - The user's internal ID
 * @param timezone - User's timezone (e.g., 'Europe/Vilnius')
 * @returns Dashboard statistics
 */
export async function getDashboardStats(
  userId: number,
  timezone: string
): Promise<DashboardStats> {
  // Parallel queries for performance (RESEARCH.md pitfall #4)
  const [totalPostsResult, favoritesResult, usageResult, subscriptionResult] = await Promise.all([
    // Total posts count (soft-delete filtering per RESEARCH.md pitfall #6)
    db
      .select({ count: count() })
      .from(posts)
      .where(
        and(
          eq(posts.userId, userId),
          isNull(posts.deletedAt)
        )
      ),

    // Favorites count
    db
      .select({ count: count() })
      .from(posts)
      .where(
        and(
          eq(posts.userId, userId),
          eq(posts.isFavorite, 1),
          isNull(posts.deletedAt)
        )
      ),

    // Usage limits (for today's generation count)
    db
      .select()
      .from(usageLimits)
      .where(eq(usageLimits.userId, userId))
      .limit(1),

    // Subscription status
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1)
  ]);

  // Extract counts (default to 0 if no results)
  const totalPosts = totalPostsResult[0]?.count || 0;
  const favorites = favoritesResult[0]?.count || 0;

  // Get usage count (generations today)
  const usage = usageResult[0];
  const generationsToday = usage?.usedCount || 0;

  // Get subscription info
  const sub = subscriptionResult[0];
  const subscription = sub ? {
    status: sub.status,
    credits: sub.credits,
    plan: sub.stripePriceId || undefined
  } : null;

  return {
    generationsToday,
    totalPosts,
    favorites,
    subscription
  };
}
