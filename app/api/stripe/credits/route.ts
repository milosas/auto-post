import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { CREDIT_PACKAGES, type CreditPackageKey } from '@/lib/stripe/config';
import { db } from '@/app/db';
import { users, subscriptions } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

// Request body type
interface CreditsRequest {
  packageId: CreditPackageKey;
}

/**
 * POST /api/stripe/credits - Create credit package Checkout Session
 *
 * Requires authentication.
 * Creates a Stripe Checkout Session for one-time credit purchase.
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
    const body: CreditsRequest = await request.json();

    // 3. Validate packageId
    if (!body.packageId) {
      return NextResponse.json(
        { error: 'Missing required field: packageId' },
        { status: 400 }
      );
    }

    // 4. Validate packageId exists in CREDIT_PACKAGES
    const creditPackage = CREDIT_PACKAGES[body.packageId];
    if (!creditPackage) {
      return NextResponse.json(
        { error: 'Invalid packageId. Must be one of: 10, 30, 100' },
        { status: 400 }
      );
    }

    // 5. Get internal user ID from auth ID
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

    // 6. Get or create Stripe customer
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

    // 7. Create Checkout Session for one-time payment
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment, NOT subscription
      customer: customerId,
      line_items: [
        {
          price: creditPackage.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?credits=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?credits=canceled`,
      metadata: {
        userId: dbUser.id.toString(),
        credits: creditPackage.credits.toString(),
        type: 'credit_purchase', // Helps webhook handler distinguish from subscriptions
      },
    });

    // 8. Return session URL
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
    console.error('Error in POST /api/stripe/credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
