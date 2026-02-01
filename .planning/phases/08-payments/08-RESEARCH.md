# Phase 8: Payments - Research

**Researched:** 2026-02-01
**Domain:** Stripe subscriptions, one-time payments, and webhook integration with Next.js 15 App Router
**Confidence:** HIGH

## Summary

Phase 8 implements payment processing via Stripe for subscription tiers (Starter/Pro/Unlimited with monthly/annual billing) and one-time credit purchases. The research confirms Stripe as the industry-standard solution with excellent Next.js integration patterns that have matured significantly for the App Router architecture.

The standard approach combines Stripe Checkout (pre-built hosted UI) for payment collection, Stripe Customer Portal for subscription management, and webhook handlers for real-time event processing. Critical implementation details include proper webhook signature verification with raw request bodies, idempotent event processing using database-tracked event IDs, and atomic credit deduction patterns.

**Primary recommendation:** Use Stripe Checkout Sessions with metadata for user tracking, implement webhook handlers with strict idempotency controls, leverage atomic SQL updates for credit deduction, and utilize Subscription Schedules for downgrade timing.

## Standard Stack

The established libraries/tools for Stripe payments in Next.js 15:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | 20.2.0+ | Official Stripe SDK for server-side operations | Official Stripe Node.js library, actively maintained, required for server operations |
| @stripe/stripe-js | Latest | Client-side Stripe.js loader | Official Stripe client library, PCI-compliant, loads from Stripe CDN |
| Next.js 15 | 15.1.12+ | App Router framework | Native Web APIs (Request/Response), server components, route handlers |
| Drizzle ORM | 0.45.1 | Database operations | Already in use, supports atomic updates with sql`` template |
| Supabase | 2.93.3+ | Auth and database | Already in use, unified auth/data layer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @stripe/react-stripe-js | Latest | React components for Stripe elements | Only if building custom payment forms (NOT needed for Checkout) |
| Stripe CLI | Latest | Local webhook testing | Development/testing only, forwards events to localhost |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe Checkout | Stripe Elements | Checkout = hosted UI (faster), Elements = embedded (more customization, more code) |
| Webhook handlers | Polling Stripe API | Webhooks = real-time + Stripe-recommended, polling = delay + API quota waste |
| Metadata tracking | Customer lookup API | Metadata = embedded in events (faster), API lookup = extra latency per webhook |

**Installation:**
```bash
npm install stripe @stripe/stripe-js
# Stripe CLI for development (install globally)
npm install -g stripe-cli
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── api/
│   ├── stripe/
│   │   ├── checkout/route.ts          # Create Checkout Sessions
│   │   ├── portal/route.ts            # Create Customer Portal sessions
│   │   ├── webhooks/route.ts          # Handle Stripe events (CRITICAL)
│   │   └── credits/route.ts           # Purchase credit packages
lib/
├── stripe/
│   ├── client.ts                      # Stripe instance (singleton)
│   ├── config.ts                      # Price IDs, product IDs, plans
│   ├── webhooks/
│   │   ├── handlers.ts                # Event-specific handlers
│   │   └── idempotency.ts             # Event ID tracking
│   └── subscriptions.ts               # Subscription helpers
app/
├── pricing/
│   └── page.tsx                       # Public pricing page
└── dashboard/
    └── billing/
        └── page.tsx                   # Subscription management UI
```

### Pattern 1: Checkout Session Creation (Subscriptions)
**What:** Create Stripe Checkout Session with user metadata for webhook correlation
**When to use:** User clicks "Subscribe to Pro" button
**Example:**
```typescript
// Source: https://dev.to/flnzba/33-stripe-integration-guide-for-nextjs-15-with-supabase-13b5
// app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/app/db';
import { users, subscriptions } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: Request) {
  const { priceId } = await request.json();

  // 1. Authenticate user
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get internal user ID
  const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id));
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 3. Get or create Stripe customer
  let customerId: string;
  const [existingSub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, dbUser.id));

  if (existingSub?.stripeCustomerId) {
    customerId = existingSub.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: authUser.email,
      metadata: { userId: dbUser.id.toString() }
    });
    customerId = customer.id;
  }

  // 4. Create Checkout Session with metadata
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?payment=canceled`,
    metadata: {
      userId: dbUser.id.toString(), // CRITICAL for webhook correlation
      priceId
    },
  });

  return NextResponse.json({ url: session.url });
}
```

### Pattern 2: Webhook Handler with Idempotency
**What:** Process Stripe webhook events with duplicate prevention
**When to use:** Stripe sends subscription lifecycle events
**Example:**
```typescript
// Source: https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/
// app/api/stripe/webhooks/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db } from '@/app/db';
import { subscriptions, webhookEvents } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  // 1. Get raw body for signature verification (CRITICAL)
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  // 2. Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 3. Idempotency check - prevent duplicate processing
  const existingEvent = await db.select()
    .from(webhookEvents)
    .where(eq(webhookEvents.stripeEventId, event.id))
    .limit(1);

  if (existingEvent.length > 0) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true }); // Return 2xx immediately
  }

  // 4. Process event
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
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    // 5. Record event as processed AFTER successful handling
    await db.insert(webhookEvents).values({
      stripeEventId: event.id,
      eventType: event.type,
      processedAt: new Date(),
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing event ${event.id}:`, error);
    // Return 500 so Stripe retries
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = parseInt(session.metadata?.userId || '0');
  if (!userId) throw new Error('No userId in session metadata');

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Create or update subscription record
  await db.insert(subscriptions).values({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: session.metadata?.priceId || '',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Will be updated by subscription.updated
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: subscriptions.userId,
    set: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: 'active',
      updatedAt: new Date(),
    }
  });
}
```

### Pattern 3: Atomic Credit Deduction
**What:** Safely decrement credits without race conditions
**When to use:** User generates a post and has credits (not subscription)
**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/guides/decrementing-a-value
// lib/credits/deduct.ts
import { db } from '@/app/db';
import { subscriptions } from '@/app/db/schema';
import { eq, sql, gte } from 'drizzle-orm';

export async function deductCredit(userId: number, amount = 1): Promise<boolean> {
  // Atomic decrement with balance check in WHERE clause
  const result = await db
    .update(subscriptions)
    .set({
      credits: sql`${subscriptions.credits} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(
      eq(subscriptions.userId, userId),
      gte(subscriptions.credits, amount) // Only update if balance sufficient
    )
    .returning({ id: subscriptions.id });

  // Check if update succeeded (row was affected)
  return result.length > 0;
}
```

### Pattern 4: Customer Portal Session
**What:** Let users manage subscriptions via Stripe-hosted portal
**When to use:** User clicks "Manage Subscription" in billing settings
**Example:**
```typescript
// Source: https://docs.stripe.com/customer-management/integrate-customer-portal
// app/api/stripe/portal/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/app/db';
import { users, subscriptions } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id));
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, dbUser.id));

  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: 'No subscription' }, { status: 404 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
```

### Pattern 5: Credit Package Purchase (One-time Payment)
**What:** Create Checkout Session for one-time credit purchase
**When to use:** User buys credit package without subscription
**Example:**
```typescript
// Source: https://docs.stripe.com/payments/checkout/how-checkout-works
// app/api/stripe/credits/route.ts
export async function POST(request: Request) {
  const { packageId } = await request.json(); // '10', '30', '100'

  const packages = {
    '10': { priceId: 'price_xxx', credits: 10 },
    '30': { priceId: 'price_yyy', credits: 30 },
    '100': { priceId: 'price_zzz', credits: 100 },
  };

  const pkg = packages[packageId as keyof typeof packages];

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: pkg.priceId, quantity: 1 }],
    mode: 'payment', // One-time payment, not subscription
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?credits=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?credits=canceled`,
    metadata: {
      userId: dbUser.id.toString(),
      credits: pkg.credits.toString(),
      type: 'credit_purchase',
    },
  });

  return NextResponse.json({ url: session.url });
}
```

### Anti-Patterns to Avoid
- **Read-modify-write for credits:** Never SELECT balance, check in code, then UPDATE. Use atomic WHERE clause checks.
- **Skipping idempotency:** Stripe retries webhooks for 3 days. Without event ID tracking, you'll create duplicate subscriptions/credits.
- **Trusting webhook data without signature verification:** Anyone can POST to your webhook endpoint. ALWAYS verify signature.
- **Using test/live mode secrets inconsistently:** Using test webhook secret in production = all webhooks fail silently.
- **Parsing request body before signature check:** Next.js body parsers modify raw body, breaking signature verification. Use `request.text()` first.
- **Complex logic in webhook handler before 2xx response:** Stripe times out after ~30s. Process asynchronously or return 2xx immediately.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Subscription management UI | Custom billing dashboard with plan switching | Stripe Customer Portal | Handles plan changes, payment methods, invoices, cancellation flow, PCI compliance, localization |
| Payment form | Custom credit card inputs | Stripe Checkout | Pre-built, PCI-compliant, handles 3D Secure, supports 40+ payment methods, mobile-optimized |
| Proration calculation | Manual prorated refund/charge logic | Stripe automatic proration | Handles mid-cycle upgrades/downgrades, timezone-aware, accounts for trials |
| Failed payment retry | Custom retry scheduler | Stripe Smart Retries | ML-based retry timing, automatic email reminders, dunning management |
| Webhook event ordering | Custom event sequencing logic | Fetch from Stripe API in webhook | Events may arrive out of order; query Stripe for current state instead |
| Credit deduction race conditions | Application-level locks | Atomic SQL UPDATE with WHERE check | Database guarantees atomicity; app locks don't survive crashes |

**Key insight:** Payment infrastructure has regulatory compliance (PCI DSS), fraud prevention, and internationalization requirements that take years to implement correctly. Stripe handles all of this in a pre-built, battle-tested solution.

## Common Pitfalls

### Pitfall 1: Webhook Signature Verification Failure
**What goes wrong:** Webhook signature verification fails with 400 errors in production
**Why it happens:**
- Using test mode webhook secret in production (most common)
- Body parser middleware modifies raw request body before verification
- Incorrect header name (`stripe-signature` vs `Stripe-Signature`)
- Signature timeout (5-minute window from Stripe event creation)
**How to avoid:**
- Use separate `STRIPE_WEBHOOK_SECRET_TEST` and `STRIPE_WEBHOOK_SECRET_LIVE` env vars
- In Next.js App Router, use `await request.text()` to get raw body BEFORE any parsing
- Access headers with exact case: `headers().get('stripe-signature')`
- Process webhooks promptly; don't queue for hours before processing
**Warning signs:**
- Webhook endpoint shows 400 errors in Stripe Dashboard
- Local webhooks work, production fails (env var mismatch)
- Signature verification error: "No signatures found matching the expected signature"

### Pitfall 2: Missing Idempotency Checks
**What goes wrong:** Duplicate subscriptions, double credit grants, multiple invoices
**Why it happens:**
- Stripe retries failed webhooks (3 days, exponential backoff)
- Network issues cause Stripe to not receive 2xx response despite processing
- Developer tests by manually resending events from Dashboard
**How to avoid:**
- Track processed event IDs in `webhook_events` table with UNIQUE constraint
- Check for existing event ID BEFORE processing business logic
- Use database transactions to ensure atomic "check + process + record"
- Return 2xx immediately after recording event, even if already processed
**Warning signs:**
- Users report "I was charged twice"
- Multiple subscription records for same user
- Credit balance increases by same amount multiple times

### Pitfall 3: Webhook Event Ordering Assumptions
**What goes wrong:** Logic assumes `subscription.created` arrives before `subscription.updated`, but they arrive reversed
**Why it happens:**
- Stripe does not guarantee event delivery order
- Network latency varies per webhook delivery
- Concurrent subscription changes trigger events milliseconds apart
**How to avoid:**
- Never depend on event order in business logic
- If event references entity you don't have, fetch from Stripe API
- Use event timestamps to determine actual chronology if needed
- Design handlers to be order-independent (upsert, not insert)
**Warning signs:**
- "Foreign key violation" errors in webhook logs
- Subscription status incorrect despite webhook processing
- Event handler fails with "Subscription not found"

### Pitfall 4: Subscription vs Credit Logic Confusion
**What goes wrong:** Subscribed user's generation quota decrements credits instead of subscription quota
**Why it happens:**
- Not checking subscription status before credit check
- Assuming subscription record exists = user is subscribed
- Missing status validation (`status = 'active'` check)
**How to avoid:**
- Check `status = 'active'` AND `currentPeriodEnd > now()` before granting unlimited access
- Priority: subscription quota → credits → deny
- Explicitly handle `past_due`, `canceled`, `incomplete` statuses
**Warning signs:**
- Subscribed users report credit deductions
- "Unlimited" plan users see quota limits
- Credits depleted despite active subscription

### Pitfall 5: Test Cards in Production
**What goes wrong:** Production accepts test card 4242 4242 4242 4242 and creates "successful" payments that aren't real
**Why it happens:**
- Using test mode Stripe keys in production environment
- Not validating which mode Checkout Session was created in
- `.env` file misconfiguration
**How to avoid:**
- Use separate env vars: `STRIPE_SECRET_KEY_TEST` and `STRIPE_SECRET_KEY`
- Validate in CI that production deploys use keys starting with `sk_live_`
- Monitor Stripe Dashboard mode indicator
- Test credit card detection in production (should fail)
**Warning signs:**
- "Successful" payments appear but Stripe balance is €0
- Webhook events arrive in test mode dashboard, not live
- Real credit cards fail with "Invalid API key"

### Pitfall 6: Downgrade Timing Confusion
**What goes wrong:** User downgrades from Pro to Starter, expects change "next billing cycle", but loses access immediately
**Why it happens:**
- Default subscription update applies immediately with proration
- Not using Subscription Schedules for deferred changes
- Miscommunicating timing to user
**How to avoid:**
- For downgrades: use Subscription Schedules with `end_behavior: 'release'`
- For upgrades: apply immediately with `proration_behavior: 'always_invoice'`
- Show clear messaging: "Change takes effect [date]"
- Store `cancel_at_period_end` flag for UI display
**Warning signs:**
- User complaints: "I paid for the month but lost access"
- Refund requests for partial month
- Subscription record shows immediate tier change

## Code Examples

Verified patterns from official sources:

### Creating Products and Prices (Setup Script)
```typescript
// Source: https://docs.stripe.com/products-prices/how-products-and-prices-work
// scripts/setup-stripe-products.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

async function setupProducts() {
  // Create Starter product with monthly + annual prices
  const starterProduct = await stripe.products.create({
    name: 'Starter',
    description: '30 generacijos per mėnesį',
    metadata: { tier: 'starter', quota: '30' }
  });

  const starterMonthly = await stripe.prices.create({
    product: starterProduct.id,
    currency: 'eur',
    unit_amount: 900, // €9.00
    recurring: { interval: 'month' },
    metadata: { plan: 'starter', interval: 'month' }
  });

  const starterAnnual = await stripe.prices.create({
    product: starterProduct.id,
    currency: 'eur',
    unit_amount: 9000, // €90.00 (2 months free)
    recurring: { interval: 'year' },
    metadata: { plan: 'starter', interval: 'year' }
  });

  // Pro product
  const proProduct = await stripe.products.create({
    name: 'Pro',
    description: '70 generacijų per mėnesį',
    metadata: { tier: 'pro', quota: '70' }
  });

  const proMonthly = await stripe.prices.create({
    product: proProduct.id,
    currency: 'eur',
    unit_amount: 1900, // €19.00
    recurring: { interval: 'month' },
    metadata: { plan: 'pro', interval: 'month' }
  });

  const proAnnual = await stripe.prices.create({
    product: proProduct.id,
    currency: 'eur',
    unit_amount: 19000, // €190.00
    recurring: { interval: 'year' },
    metadata: { plan: 'pro', interval: 'year' }
  });

  // Unlimited product
  const unlimitedProduct = await stripe.products.create({
    name: 'Unlimited',
    description: 'Neribota generacijų',
    metadata: { tier: 'unlimited', quota: '-1' }
  });

  const unlimitedMonthly = await stripe.prices.create({
    product: unlimitedProduct.id,
    currency: 'eur',
    unit_amount: 4900, // €49.00
    recurring: { interval: 'month' },
    metadata: { plan: 'unlimited', interval: 'month' }
  });

  const unlimitedAnnual = await stripe.prices.create({
    product: unlimitedProduct.id,
    currency: 'eur',
    unit_amount: 49000, // €490.00
    recurring: { interval: 'year' },
    metadata: { plan: 'unlimited', interval: 'year' }
  });

  // Credit packages (one-time payments)
  const credits10 = await stripe.prices.create({
    product: 'prod_credits', // Create once
    currency: 'eur',
    unit_amount: 500, // €5.00
    metadata: { credits: '10', type: 'credit_package' }
  });

  const credits30 = await stripe.prices.create({
    product: 'prod_credits',
    currency: 'eur',
    unit_amount: 1200, // €12.00
    metadata: { credits: '30', type: 'credit_package' }
  });

  const credits100 = await stripe.prices.create({
    product: 'prod_credits',
    currency: 'eur',
    unit_amount: 3500, // €35.00
    metadata: { credits: '100', type: 'credit_package' }
  });

  console.log('Products and prices created successfully');
  console.log('Save these price IDs to .env:');
  console.log(`STRIPE_PRICE_STARTER_MONTHLY=${starterMonthly.id}`);
  console.log(`STRIPE_PRICE_STARTER_ANNUAL=${starterAnnual.id}`);
  console.log(`STRIPE_PRICE_PRO_MONTHLY=${proMonthly.id}`);
  console.log(`STRIPE_PRICE_PRO_ANNUAL=${proAnnual.id}`);
  console.log(`STRIPE_PRICE_UNLIMITED_MONTHLY=${unlimitedMonthly.id}`);
  console.log(`STRIPE_PRICE_UNLIMITED_ANNUAL=${unlimitedAnnual.id}`);
  console.log(`STRIPE_PRICE_CREDITS_10=${credits10.id}`);
  console.log(`STRIPE_PRICE_CREDITS_30=${credits30.id}`);
  console.log(`STRIPE_PRICE_CREDITS_100=${credits100.id}`);
}

setupProducts();
```

### Upgrade/Downgrade with Proper Timing
```typescript
// Source: https://docs.stripe.com/billing/subscriptions/upgrade-downgrade
// lib/stripe/subscriptions.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function upgradeSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<void> {
  // Upgrades are immediate with proration
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: 'always_invoice', // Charge immediately
  });
}

export async function downgradeSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<void> {
  // Downgrades occur at end of billing period
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Create schedule for deferred change
  await stripe.subscriptionSchedules.create({
    from_subscription: subscriptionId,
    phases: [
      {
        items: [{ price: subscription.items.data[0].price.id }],
        start_date: subscription.current_period_start,
        end_date: subscription.current_period_end,
      },
      {
        items: [{ price: newPriceId }],
        start_date: subscription.current_period_end,
      },
    ],
  });
}
```

### Checking User Access (Subscription vs Credits)
```typescript
// lib/usage/check-access.ts
import { db } from '@/app/db';
import { subscriptions } from '@/app/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export type AccessType = 'subscription' | 'credits' | 'none';

export async function checkUserAccess(userId: number): Promise<{
  type: AccessType;
  unlimited: boolean;
  quota?: number;
  credits?: number;
}> {
  const [sub] = await db.select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!sub) {
    return { type: 'none', unlimited: false };
  }

  // Check active subscription
  const isActive = sub.status === 'active' &&
                   sub.currentPeriodEnd &&
                   sub.currentPeriodEnd > new Date();

  if (isActive) {
    // Determine quota from stripePriceId
    const isUnlimited = sub.stripePriceId?.includes('unlimited');
    const isPro = sub.stripePriceId?.includes('pro');
    const isStarter = sub.stripePriceId?.includes('starter');

    if (isUnlimited) {
      return { type: 'subscription', unlimited: true };
    }

    return {
      type: 'subscription',
      unlimited: false,
      quota: isPro ? 70 : isStarter ? 30 : 0,
    };
  }

  // No active subscription, check credits
  if (sub.credits > 0) {
    return {
      type: 'credits',
      unlimited: false,
      credits: sub.credits,
    };
  }

  return { type: 'none', unlimited: false };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router webhook handling | App Router with `request.text()` | Next.js 13+ | Must use Web API Request/Response, no req/res objects |
| Express body-parser for webhooks | Raw body via `request.text()` | App Router | Body parsers break signature verification |
| Plans API (deprecated) | Products + Prices API | 2020 | Prices are immutable, create new price for changes |
| Manual event deduplication | Database-tracked event IDs | Always required | Stripe retries for 3 days, idempotency critical |
| Client-side secrets injection | NEXT_PUBLIC_ prefix for client vars | Next.js standard | Server secrets NEVER use NEXT_PUBLIC_ |
| Subscription Schedules (beta) | Subscription Schedules (stable) | 2023 | Recommended for deferred plan changes |

**Deprecated/outdated:**
- **Plans API**: Replaced by Prices API. Don't use `stripe.plans.*`, use `stripe.prices.*`
- **Charges API for one-time payments**: Use PaymentIntents API with Checkout Sessions instead
- **Sources API**: Replaced by PaymentMethods API for saving cards
- **Webhook endpoint per event**: Use single endpoint with event type switching

## Open Questions

Things that couldn't be fully resolved:

1. **Monthly vs Calendar Month for Subscription Quotas**
   - What we know: Stripe subscriptions track `current_period_start` and `current_period_end`
   - What's unclear: Should "30 generations/month" reset on subscription anniversary or calendar month?
   - Recommendation: Use subscription period (Stripe's billing cycle) for consistency with invoicing. Store quota in subscription metadata or determine from stripePriceId.

2. **Credit Audit Trail for Compliance**
   - What we know: Credits should never expire, are purchased with real money
   - What's unclear: Do we need transaction history for credit additions/deductions for accounting?
   - Recommendation: Create `credit_transactions` table tracking: userId, type ('purchase'|'deduction'), amount, stripeSessionId, createdAt. Required for refund handling and user support.

3. **Failed Payment Grace Period Implementation**
   - What we know: 3-day grace period with email reminders before downgrade
   - What's unclear: Does Stripe Smart Retries handle this automatically or do we need custom logic?
   - Recommendation: Enable Smart Retries in Dashboard (automatic). For custom grace period, track `invoice.payment_failed` event timestamp and downgrade after 3 days via scheduled job.

4. **Handling Refunds and Credit Reversals**
   - What we know: Stripe can issue refunds via Dashboard or API
   - What's unclear: Should we automatically deduct credits if refund issued for credit purchase?
   - Recommendation: Listen for `charge.refunded` webhook, check metadata for credit purchase, atomically deduct credits if present. Prevent negative balance with `credits >= amount` WHERE clause.

## Sources

### Primary (HIGH confidence)
- [Stripe + Next.js 15: Complete 2025 Guide](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/) - Webhook idempotency, Customer Portal, Server Actions
- [Stripe Integration Guide for Next.js 15 with Supabase](https://dev.to/flnzba/33-stripe-integration-guide-for-nextjs-15-with-supabase-13b5) - API route structure, database schema, authentication flow
- [Stripe Official Docs: Subscription Webhooks](https://docs.stripe.com/billing/subscriptions/webhooks) - Complete subscription event reference
- [Stripe Official Docs: Upgrade/Downgrade](https://docs.stripe.com/billing/subscriptions/upgrade-downgrade) - Proration behavior, Subscription Schedules
- [Stripe Official Docs: Products and Prices](https://docs.stripe.com/products-prices/how-products-and-prices-work) - Product architecture, pricing structure
- [Stripe Official Docs: Customer Portal](https://docs.stripe.com/customer-management/integrate-customer-portal) - Portal session creation, configuration
- [Best Practices for Stripe Webhooks (Stigg)](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks) - Event ordering, signature verification, monitoring
- [Drizzle ORM: Decrement Guide](https://orm.drizzle.team/docs/guides/decrementing-a-value) - Atomic SQL decrement pattern
- [Drizzle ORM: Update Docs](https://orm.drizzle.team/docs/update) - .returning() method, WHERE conditions

### Secondary (MEDIUM confidence)
- [Next.js App Router Stripe Webhook Signature Verification (Medium)](https://kitson-broadhurst.medium.com/next-js-app-router-stripe-webhook-signature-verification-ea9d59f3593f) - request.text() pattern verified by community
- [WebSearch: Stripe Webhook Idempotency Best Practices](https://hookdeck.com/webhooks/guides/implement-webhook-idempotency) - Event ID database strategy
- [WebSearch: PostgreSQL Race Condition Prevention](https://sqlfordevs.com/transaction-locking-prevent-race-condition) - Atomic UPDATE patterns
- [WebSearch: Next.js Environment Variables](https://nextjs.org/docs/pages/guides/environment-variables) - NEXT_PUBLIC_ prefix behavior
- [Stripe npm package](https://www.npmjs.com/package/stripe) - Version 20.2.0 confirmed current

### Tertiary (LOW confidence)
- Various Medium articles on Stripe integration patterns (used for pattern validation only, not primary source)
- GitHub discussions on Next.js webhook handling (confirmed patterns, not relied on for implementation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Stripe SDK, well-documented Next.js patterns, existing project dependencies
- Architecture: HIGH - Verified patterns from official Stripe docs and recent Next.js 15 guides
- Pitfalls: HIGH - Sourced from Stripe official docs, production war stories, official best practices

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable payment APIs, incremental Stripe updates)
