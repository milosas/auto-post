import { db } from '@/app/db';
import { subscriptions, posts } from '@/app/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { getPlanByPriceId } from './config';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type AccessType = 'subscription' | 'credits' | 'free';

export type UserAccess = {
  type: AccessType;
  unlimited: boolean;
  quota?: number;          // For subscription: monthly quota
  used?: number;           // For subscription: used this period
  credits?: number;        // For credits: current balance
  periodEnd?: Date;        // For subscription: when period resets
};

// ============================================
// ACCESS CHECKING
// ============================================

/**
 * Get user's access level and quota information.
 *
 * Priority: active subscription > credits > free tier
 *
 * @param userId - Internal user ID
 * @returns UserAccess object with type, quota, and usage info
 */
export async function getUserAccess(userId: number): Promise<UserAccess> {
  // Query subscription record
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  // No record or explicitly free status
  if (!sub || sub.status === 'free') {
    return { type: 'free', unlimited: false };
  }

  const now = new Date();

  // Check for active subscription
  const isActiveSubscription =
    sub.status === 'active' &&
    sub.currentPeriodEnd &&
    sub.currentPeriodEnd > now &&
    sub.stripePriceId;

  if (isActiveSubscription) {
    // Determine plan details from price ID
    const planInfo = getPlanByPriceId(sub.stripePriceId!);

    if (!planInfo) {
      // Unknown price ID - treat as free
      return { type: 'free', unlimited: false };
    }

    const quota = planInfo.plan.quota;
    const unlimited = quota === -1;

    // If unlimited, no need to count usage
    if (unlimited) {
      return {
        type: 'subscription',
        unlimited: true,
        periodEnd: sub.currentPeriodEnd!,
      };
    }

    // Get usage in current billing period
    const used = await getSubscriptionQuotaUsed(userId, sub.currentPeriodStart!);

    return {
      type: 'subscription',
      unlimited: false,
      quota,
      used,
      periodEnd: sub.currentPeriodEnd!,
    };
  }

  // No active subscription, check for credits
  if (sub.credits > 0) {
    return {
      type: 'credits',
      unlimited: false,
      credits: sub.credits,
    };
  }

  // No subscription, no credits
  return { type: 'free', unlimited: false };
}

/**
 * Quick check if user has an active subscription.
 * Useful for UI optimization without full access check.
 *
 * @param userId - Internal user ID
 * @returns true if user has active subscription
 */
export async function hasActiveSubscription(userId: number): Promise<boolean> {
  const [sub] = await db
    .select({
      status: subscriptions.status,
      periodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!sub) {
    return false;
  }

  const now = new Date();
  return sub.status === 'active' &&
         sub.periodEnd !== null &&
         sub.periodEnd > now;
}

/**
 * Count generations used in current billing period.
 *
 * @param userId - Internal user ID
 * @param periodStart - Start of current billing period
 * @returns Number of generations since period start
 */
export async function getSubscriptionQuotaUsed(
  userId: number,
  periodStart: Date
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(
      and(
        eq(posts.userId, userId),
        gte(posts.createdAt, periodStart),
        sql`${posts.deletedAt} IS NULL`
      )
    );

  return result[0]?.count || 0;
}

// ============================================
// CREDIT OPERATIONS
// ============================================

/**
 * Atomically deduct credits from user's balance.
 *
 * Uses atomic SQL UPDATE with WHERE check to prevent race conditions.
 * Multiple simultaneous requests will be safely serialized by database.
 *
 * @param userId - Internal user ID
 * @param amount - Number of credits to deduct (default 1)
 * @returns true if deduction succeeded, false if insufficient balance
 */
export async function deductCredit(
  userId: number,
  amount: number = 1
): Promise<boolean> {
  // Atomic decrement with balance check in WHERE clause
  // Only updates if credits >= amount
  const result = await db
    .update(subscriptions)
    .set({
      credits: sql`${subscriptions.credits} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptions.userId, userId),
        gte(subscriptions.credits, amount)
      )
    )
    .returning({ id: subscriptions.id });

  // If result is empty, insufficient balance
  return result.length > 0;
}
