import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/app/db';
import { users, subscriptions } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/stripe/portal - Create Customer Portal session
 *
 * Requires authentication.
 * Creates a Stripe Customer Portal session for subscription management.
 * User must have an existing subscription (stripeCustomerId must exist).
 */
export async function POST(request: NextRequest) {
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

    // 3. Lookup user's stripeCustomerId from subscriptions table
    const subscription = await db
      .select({ stripeCustomerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, dbUser.id))
      .limit(1);

    if (!subscription.length || !subscription[0].stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found. You must subscribe first before accessing the customer portal.' },
        { status: 404 }
      );
    }

    const stripeCustomerId = subscription[0].stripeCustomerId;

    // 4. Create Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
    });

    // 5. Return portal URL
    return NextResponse.json(
      { url: portalSession.url },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Error in POST /api/stripe/portal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
