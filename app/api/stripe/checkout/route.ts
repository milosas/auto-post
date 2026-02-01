import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/app/db';
import { users, subscriptions } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

// Request body type
interface CheckoutRequest {
  priceId: string;
}

/**
 * POST /api/stripe/checkout - Create subscription Checkout Session
 *
 * Requires authentication.
 * Creates a Stripe Checkout Session for subscription purchase.
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

    // 2. Parse request body
    const body: CheckoutRequest = await request.json();

    // 3. Validate priceId
    if (!body.priceId) {
      return NextResponse.json(
        { error: 'Missing required field: priceId' },
        { status: 400 }
      );
    }

    // 4. Get internal user ID from auth ID
    const internalUser = await db
      .select({ id: users.id, email: users.email })
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

    // 5. Get or create Stripe customer
    let customerId: string;

    // Check if user already has a Stripe customer ID
    const existingSubscription = await db
      .select({ stripeCustomerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, dbUser.id))
      .limit(1);

    if (existingSubscription.length > 0 && existingSubscription[0].stripeCustomerId) {
      // Use existing customer
      customerId = existingSubscription[0].stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: dbUser.email,
        metadata: {
          userId: dbUser.id.toString(),
        },
      });
      customerId = customer.id;
    }

    // 6. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: body.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?payment=canceled`,
      metadata: {
        userId: dbUser.id.toString(),
        priceId: body.priceId,
      },
    });

    // 7. Return session URL
    return NextResponse.json(
      { url: session.url },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Error in POST /api/stripe/checkout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
