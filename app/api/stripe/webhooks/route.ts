import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/app/db';
import { webhookEvents } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import {
  handleCheckoutComplete,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentFailed,
} from '@/lib/stripe/webhooks/handlers';

/**
 * POST /api/stripe/webhooks - Stripe webhook handler
 *
 * Verifies webhook signature and routes events to appropriate handlers.
 * Implements idempotency to prevent duplicate event processing.
 *
 * CRITICAL: This route must NOT have any body parsing middleware.
 * We need the raw body for signature verification.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Webhook error: No stripe-signature header');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    // 2. Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      const error = err as Error;
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Received webhook event: ${event.type} (${event.id})`);

    // 3. Idempotency check - skip if already processed
    const [existingEvent] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.stripeEventId, event.id))
      .limit(1);

    if (existingEvent) {
      console.log(`Event ${event.id} already processed at ${existingEvent.processedAt}, skipping`);
      return NextResponse.json({ received: true });
    }

    // 4. Route to appropriate handler based on event type
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // 5. Record event as processed AFTER successful handling
      await db.insert(webhookEvents).values({
        stripeEventId: event.id,
        eventType: event.type,
        processedAt: new Date(),
      });

      console.log(`Successfully processed event ${event.id}`);
      return NextResponse.json({ received: true });

    } catch (handlerError) {
      // Return 500 for processing errors (triggers Stripe retry)
      const error = handlerError as Error;
      console.error(`Error processing event ${event.id}:`, error.message);
      return NextResponse.json(
        { error: 'Event processing failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
