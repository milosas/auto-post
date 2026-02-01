import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { getUserAccess } from '@/lib/stripe/subscriptions';

/**
 * GET /api/subscription/status - Get user's subscription status
 *
 * Requires authentication.
 * Returns UserAccess object with subscription/credit details.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get internal user ID from auth ID
    const internalUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, authUser.id))
      .limit(1);

    if (!internalUser || internalUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const dbUser = internalUser[0];

    // 3. Get user access level (subscription/credits/free)
    const access = await getUserAccess(dbUser.id);

    // 4. Return access details
    return NextResponse.json(access, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in GET /api/subscription/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
