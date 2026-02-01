import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { getUsage, checkAndIncrementUsage } from '@/lib/usage/queries';

// Use Node.js runtime for Drizzle (requires Node.js built-ins)
export const runtime = 'nodejs';

/**
 * GET /api/usage - Get current usage status
 *
 * Returns:
 * - 200: { used, limit, resetAt } - Current usage state
 * - 401: { error: 'Unauthorized' } - Not authenticated
 * - 404: { error: 'User not found' } - User not in database
 * - 500: { error: 'Internal server error' } - Unexpected error
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Look up internal user ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.authId, authUser.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Get timezone from header or fallback to UTC
    const timezone = request.headers.get('X-Timezone') || 'UTC';

    // 4. Get usage status
    const usage = await getUsage(user.id, timezone);

    // 5. Return usage data
    return NextResponse.json({
      used: usage.used,
      limit: usage.limit,
      resetAt: usage.resetAt.toISOString(),
    });
  } catch (error) {
    console.error('GET /api/usage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/usage - Increment usage counter
 *
 * Returns:
 * - 200: { allowed: true, used, limit, resetAt } - Increment successful
 * - 429: { allowed: false, used, limit, resetAt } - Limit reached
 * - 401: { error: 'Unauthorized' } - Not authenticated
 * - 404: { error: 'User not found' } - User not in database
 * - 500: { error: 'Internal server error' } - Unexpected error
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Look up internal user ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.authId, authUser.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Get timezone from header or fallback to UTC
    const timezone = request.headers.get('X-Timezone') || 'UTC';

    // 4. Check and increment usage
    const result = await checkAndIncrementUsage(user.id, timezone);

    // 5. Return result based on allowed status
    if (!result.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          used: result.used,
          limit: result.limit,
          resetAt: result.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      allowed: true,
      used: result.used,
      limit: result.limit,
      resetAt: result.resetAt.toISOString(),
    });
  } catch (error) {
    console.error('POST /api/usage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
