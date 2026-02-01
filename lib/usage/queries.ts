import { db } from '@/app/db';
import { usageLimits } from '@/app/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getNextMidnightUTC } from './timezone';

const FREE_TIER_LIMIT = 3;

export type UsageStatus = {
  used: number;
  limit: number;
  resetAt: Date;
};

export type IncrementResult = UsageStatus & {
  allowed: boolean;
};

/**
 * Get current usage status for a user.
 *
 * Handles:
 * - Creating initial usage record if doesn't exist
 * - Resetting counter when current time >= resetAt
 * - Returning current usage state
 *
 * @param userId - Internal user ID (not auth ID)
 * @param timezone - IANA timezone string for reset calculation
 * @returns Current usage status
 */
export async function getUsage(
  userId: number,
  timezone: string
): Promise<UsageStatus> {
  const limit = FREE_TIER_LIMIT;

  // Query existing usage record
  const [existing] = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.userId, userId))
    .limit(1);

  const now = new Date();
  const nextMidnight = getNextMidnightUTC(timezone);

  // If no record exists, create one
  if (!existing) {
    const [created] = await db
      .insert(usageLimits)
      .values({
        userId,
        usedCount: 0,
        resetAt: nextMidnight,
      })
      .returning();

    return {
      used: created.usedCount,
      limit,
      resetAt: created.resetAt,
    };
  }

  // If reset time has passed, reset the counter
  if (now >= existing.resetAt) {
    const [reset] = await db
      .update(usageLimits)
      .set({
        usedCount: 0,
        resetAt: nextMidnight,
        updatedAt: now,
      })
      .where(eq(usageLimits.id, existing.id))
      .returning();

    return {
      used: reset.usedCount,
      limit,
      resetAt: reset.resetAt,
    };
  }

  // Return current state
  return {
    used: existing.usedCount,
    limit,
    resetAt: existing.resetAt,
  };
}

/**
 * Atomically check and increment usage counter.
 *
 * Race condition protection via SQL constraint in WHERE clause.
 * If multiple requests hit simultaneously, only requests that satisfy
 * the constraint will succeed.
 *
 * @param userId - Internal user ID (not auth ID)
 * @param timezone - IANA timezone string for reset calculation
 * @returns Increment result with allowed flag and current state
 */
export async function checkAndIncrementUsage(
  userId: number,
  timezone: string
): Promise<IncrementResult> {
  const limit = FREE_TIER_LIMIT;

  // First, get current usage (handles reset logic)
  const usage = await getUsage(userId, timezone);

  // If already at limit, reject immediately
  if (usage.used >= limit) {
    return {
      allowed: false,
      used: usage.used,
      limit,
      resetAt: usage.resetAt,
    };
  }

  const now = new Date();

  // Atomic increment with race condition protection
  // The WHERE constraint ensures we only increment if under limit
  const [updated] = await db
    .update(usageLimits)
    .set({
      usedCount: sql`${usageLimits.usedCount} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(usageLimits.userId, userId),
        sql`${usageLimits.usedCount} < ${limit}` // Race condition protection
      )
    )
    .returning();

  // If update returned nothing, race condition hit the limit
  if (!updated) {
    // Re-fetch to get accurate current state
    const current = await getUsage(userId, timezone);
    return {
      allowed: false,
      used: current.used,
      limit,
      resetAt: current.resetAt,
    };
  }

  // Success - increment performed
  return {
    allowed: true,
    used: updated.usedCount,
    limit,
    resetAt: updated.resetAt,
  };
}
