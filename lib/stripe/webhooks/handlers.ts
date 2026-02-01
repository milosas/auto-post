import Stripe from 'stripe';
import { db } from '@/app/db';
import { subscriptions, users } from '@/app/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Map Stripe subscription status to our database status
 */
function mapSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'incomplete':
      return 'past_due';
    case 'incomplete_expired':
      return 'canceled';
    case 'trialing':
      return 'active';
    case 'unpaid':
      return 'past_due';
    default:
      return 'canceled';
  }
}

/**
 * Handle checkout.session.completed event
 *
 * Triggered when a customer completes a checkout session.
 * Can be for either subscription creation or one-time credit purchase.
 */
export async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;

  if (!userId) {
    throw new Error('No userId in session metadata');
  }

  console.log(`Processing checkout for user ${userId}, mode: ${session.mode}`);

  // Verify user exists
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, parseInt(userId)))
    .limit(1);

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  if (session.mode === 'subscription') {
    // Handle subscription creation
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;
    const stripePriceId = session.metadata?.priceId || '';

    console.log(`Creating/updating subscription for user ${userId}`);

    await db.insert(subscriptions).values({
      userId: parseInt(userId),
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      status: 'active',
      credits: 0,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: 0,
    }).onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId,
        stripeSubscriptionId,
        stripePriceId,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    console.log(`Subscription created/updated for user ${userId}`);

  } else if (session.mode === 'payment') {
    // Handle one-time credit purchase
    const purchaseType = session.metadata?.type;

    if (purchaseType === 'credit_purchase') {
      const creditsToAdd = parseInt(session.metadata?.credits || '0');

      if (creditsToAdd > 0) {
        console.log(`Adding ${creditsToAdd} credits to user ${userId}`);

        // Check if user has a subscription record
        const [existingSubscription] = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(eq(subscriptions.userId, parseInt(userId)))
          .limit(1);

        if (existingSubscription) {
          // Update existing subscription with atomic credit increment
          await db.update(subscriptions)
            .set({
              credits: sql`${subscriptions.credits} + ${creditsToAdd}`,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, parseInt(userId)));
        } else {
          // Create subscription record with 'free' status for credit tracking
          await db.insert(subscriptions).values({
            userId: parseInt(userId),
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: null,
            stripePriceId: null,
            status: 'free',
            credits: creditsToAdd,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: 0,
          });
        }

        console.log(`Added ${creditsToAdd} credits to user ${userId}`);
      }
    }
  }
}

/**
 * Handle customer.subscription.updated event
 *
 * Triggered when subscription details change (price, status, period, etc.)
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;
  const customerId = subscription.customer as string;

  console.log(`Updating subscription ${stripeSubscriptionId}`);

  // Get price ID from first subscription item
  const stripePriceId = subscription.items.data[0]?.price.id || '';
  const status = mapSubscriptionStatus(subscription.status);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end ? 1 : 0;

  // Update subscription using stripeSubscriptionId as key
  const result = await db.update(subscriptions)
    .set({
      stripePriceId,
      status,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

  console.log(`Subscription ${stripeSubscriptionId} updated to status: ${status}`);
}

/**
 * Handle customer.subscription.deleted event
 *
 * Triggered when subscription is canceled and period ends.
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;

  console.log(`Deleting subscription ${stripeSubscriptionId}`);

  // Update subscription status to canceled and clear subscription ID
  await db.update(subscriptions)
    .set({
      status: 'canceled',
      stripeSubscriptionId: null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

  console.log(`Subscription ${stripeSubscriptionId} marked as canceled`);
}

/**
 * Handle invoice.payment_failed event
 *
 * Triggered when subscription payment fails.
 * Stripe Smart Retries handles retry logic automatically.
 */
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = (invoice as any).subscription as string | null;

  if (!stripeSubscriptionId) {
    console.log('Invoice payment failed but no subscription ID found');
    return;
  }

  console.log(`Payment failed for subscription ${stripeSubscriptionId}`);

  // Update subscription status to past_due
  await db.update(subscriptions)
    .set({
      status: 'past_due',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

  console.log(`Subscription ${stripeSubscriptionId} marked as past_due`);
}
