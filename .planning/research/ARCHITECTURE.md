# Architecture Research: v2.0 User System + Payments Integration

**Project:** Social Post Generator v2.0
**Researched:** 2026-01-29
**Focus:** Adding auth, database, and Stripe to existing Next.js 15 + Vercel architecture

## Current Architecture (v1.0)

### Existing Structure
```
app/
├── page.tsx                    # Single page app, no routing
├── api/
│   ├── generate/route.ts       # Text generation (Edge Runtime)
│   └── generate-image/route.ts # DALL-E image generation (Edge Runtime)
├── components/                 # 13 UI components
├── lib/
│   ├── ai.ts                   # OpenAI client config
│   ├── rate-limit.ts          # Upstash Redis rate limiting
│   ├── industries.ts          # Industry categories
│   └── useLocalStorage.ts     # Client state persistence
└── globals.css
```

### Current Characteristics
- **Runtime:** Edge Runtime (25s timeout vs 10s serverless)
- **State Management:** React useState + localStorage (no global store mentioned, despite zustand in PROJECT.md)
- **Rate Limiting:** IP-based via Upstash Redis (50/day, optional)
- **No routing:** Conditional rendering within single page
- **No auth:** Anonymous usage
- **No database:** Stateless, no persistence beyond rate limiting

### Deployment
- **Platform:** Vercel
- **Functions:** Edge Functions for API routes
- **Storage:** None (stateless)

## Integration Architecture for v2.0

### Authentication Layer

#### Recommended Solution: Clerk
**Why Clerk over NextAuth/Auth.js:**
- **Edge Runtime Native:** Clerk is edge-native, avoiding NextAuth's Edge compatibility issues
- **OAuth Built-In:** Google + Facebook OAuth without manual provider configuration
- **Middleware Support:** Full middleware support without JWT/database adapter split
- **DX:** Component-first approach matches existing React pattern
- **Session Management:** HTTP-only cookies, automatic refresh

**Integration Points:**
```
middleware.ts (NEW)              # Clerk middleware for route protection
app/layout.tsx (MODIFY)          # Wrap with <ClerkProvider>
app/sign-in/[[...sign-in]]/page.tsx (NEW)   # Sign-in route
app/sign-up/[[...sign-up]]/page.tsx (NEW)   # Sign-up route
app/dashboard/page.tsx (NEW)     # Protected dashboard route
```

**Auth State Flow:**
1. Clerk middleware intercepts all requests
2. Session validated via HTTP-only cookies (edge-compatible)
3. User object available in Server Components via `auth()`
4. Client components access via `useUser()` hook
5. API routes validate via `auth()` helper

**Route Protection Pattern:**
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/generate-user(.*)',  // User-specific endpoints
])

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

**Security Considerations:**
- **CVE-2025-29927:** Never rely solely on middleware for auth (Next.js 15.2.3+ required)
- **Data Access Layer:** Verify auth at every data access point, not just middleware
- **Layout Caveat:** Layouts don't re-render on navigation - check auth close to data source

### Database Layer

#### Recommended Solution: Vercel Postgres + Drizzle ORM
**Why this stack:**
- **Edge Compatible:** Drizzle natively supports Edge Runtime with `@vercel/postgres` driver
- **Type Safety:** TypeScript-first ORM matching existing codebase
- **Vercel Integration:** Seamless setup, same region deployment
- **Migration DX:** Better migration story than Prisma for rapid iteration

**Integration Points:**
```
db/
├── schema.ts (NEW)              # Drizzle schema definitions
├── index.ts (NEW)               # Database client + connection
└── migrations/ (NEW)            # SQL migrations

app/api/
├── generate/route.ts (MODIFY)   # Add user_id, save to posts table
├── generate-image/route.ts (MODIFY) # Link image to post record
└── webhooks/stripe/route.ts (NEW)   # Stripe webhook handler
```

**Database Schema:**

```typescript
// db/schema.ts
import { pgTable, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  status: text('status').notNull(), // active, canceled, past_due, etc.
  planType: text('plan_type').notNull(), // free, pro, premium
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  credits: integer('credits').default(0), // For credit-based system
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('subscription_user_idx').on(table.userId),
  customerIdx: index('subscription_customer_idx').on(table.stripeCustomerId),
}))

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  industry: text('industry').notNull(),
  prompt: text('prompt').notNull(),
  generatedText: text('generated_text').notNull(),
  config: jsonb('config').notNull(), // { tone, emoji, length }
  imageUrl: text('image_url'),
  imageSource: text('image_source'), // 'upload' | 'ai'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index('post_user_created_idx').on(table.userId, table.createdAt),
}))

export const usageLimits = pgTable('usage_limits', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  textGenerations: integer('text_generations').default(0),
  imageGenerations: integer('image_generations').default(0),
}, (table) => ({
  userDateIdx: index('usage_user_date_idx').on(table.userId, table.date),
}))
```

**Connection Setup (Edge Compatible):**
```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/vercel-postgres'
import { sql } from '@vercel/postgres'
import * as schema from './schema'

export const db = drizzle(sql, { schema })
```

**Data Flow Changes:**
1. **Before (v1.0):** Request → Validate → Generate → Stream response
2. **After (v2.0):** Request → Auth check → Usage check → Generate → Save to DB → Stream response

### Payments Layer

#### Recommended Solution: Stripe with Webhooks
**Why Stripe:**
- **Standard:** Industry standard for SaaS payments
- **Subscriptions:** Built-in subscription management
- **Credits:** Can track via Stripe metadata + local DB
- **Webhooks:** Reliable event-driven architecture

**Integration Points:**
```
app/api/
├── checkout/route.ts (NEW)          # Create Stripe checkout session
├── portal/route.ts (NEW)            # Customer portal redirect
└── webhooks/stripe/route.ts (NEW)   # Webhook handler (Node runtime!)

app/dashboard/
├── page.tsx (NEW)                   # Post history
├── billing/page.tsx (NEW)           # Subscription management
```

**Stripe Webhook Architecture:**

**CRITICAL: Webhooks must use Node.js Runtime, not Edge**
```typescript
// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// IMPORTANT: Edge Runtime doesn't support raw body parsing for signature verification
export const runtime = 'nodejs' // NOT 'edge'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: Request) {
  // Must use request.text(), NOT request.json()
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle events
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      // Update subscriptions table
      break
    case 'customer.subscription.deleted':
      // Set status to 'canceled'
      break
    case 'invoice.payment_succeeded':
      // Reset usage limits, add credits
      break
    case 'invoice.payment_failed':
      // Update status to 'past_due'
      break
  }

  return NextResponse.json({ received: true })
}
```

**Subscription Flow:**
1. User clicks "Upgrade" in dashboard
2. `POST /api/checkout` creates Stripe Checkout Session
3. User redirects to Stripe, completes payment
4. Stripe sends `customer.subscription.created` webhook
5. Webhook handler updates `subscriptions` table
6. User redirects back to dashboard, sees updated plan

**Local Database vs Stripe API:**
- **Store locally:** subscription ID, status, plan type, period dates, credits
- **Query Stripe API:** Billing history, invoices (only on billing page)
- **Webhook sync:** Keep local status in sync with Stripe events

### Usage Tracking & Limits

#### Current Implementation (v1.0):
- IP-based rate limiting via Upstash Redis
- 50 requests/day per IP
- No user tracking

#### New Implementation (v2.0):
- **Free tier:** 3 generations/day per user
- **Paid tier:** Unlimited or credit-based
- Track in `usage_limits` table by user + date
- Check before generation, increment after success

**Modified Rate Limiting:**
```typescript
// app/api/generate/route.ts (MODIFY)
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { usageLimits, subscriptions } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export const runtime = 'edge'
export const maxDuration = 25

export async function POST(request: Request) {
  // 1. Authenticate
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Check subscription status
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  const planType = subscription?.planType || 'free'

  // 3. Check usage limits (free tier only)
  if (planType === 'free') {
    const today = new Date().toISOString().split('T')[0]
    const [usage] = await db
      .select()
      .from(usageLimits)
      .where(
        and(
          eq(usageLimits.userId, userId),
          eq(usageLimits.date, today)
        )
      )
      .limit(1)

    if (usage && usage.textGenerations >= 3) {
      return Response.json(
        { error: 'Daily limit reached. Upgrade to continue.' },
        { status: 429 }
      )
    }
  }

  // 4. Generate (existing logic)
  const body = await request.json()
  const result = streamText({ /* ... */ })

  // 5. Save to database (after successful generation)
  // TODO: Increment usage, save post

  return result.toTextStreamResponse()
}
```

## New Components Needed

### 1. Authentication Components
| Component | Purpose | Type |
|-----------|---------|------|
| `SignInButton` | Trigger Clerk sign-in modal | Client |
| `UserButton` | User menu (profile, sign out) | Client |
| `ProtectedRoute` | Wrapper for auth-required pages | Server |

### 2. Dashboard Components
| Component | Purpose | Type |
|-----------|---------|------|
| `PostHistory` | List of saved posts by date | Server |
| `PostCard` | Individual post preview | Client |
| `BillingCard` | Subscription status | Server |
| `UsageStats` | Daily usage counter | Server |

### 3. Payment Components
| Component | Purpose | Type |
|-----------|---------|------|
| `PricingTable` | Plan comparison | Client |
| `CheckoutButton` | Start Stripe checkout | Client |
| `PortalLink` | Manage subscription | Client |

## Modified Components

### 1. app/page.tsx (MAJOR CHANGES)
**Current:** Single page app with all functionality
**Modified:**
- Add authentication check
- Show "Sign in to save posts" for anonymous users
- Save posts to database after generation
- Link to dashboard for authenticated users

```typescript
// Pseudocode for changes
export default async function HomePage() {
  const { userId } = await auth() // Server component now
  const hasAccess = userId ? await checkSubscription(userId) : false

  return (
    <>
      <Header userId={userId} />
      {!userId && <CTABanner />}
      <PostGenerator
        userId={userId}
        canGenerate={userId ? hasAccess : true} // Anonymous = limited access
      />
      {userId && <QuickStats userId={userId} />}
    </>
  )
}
```

### 2. app/api/generate/route.ts (MODIFY)
**Changes:**
- Add auth check via Clerk's `auth()`
- Query subscription status from database
- Check usage limits for free tier
- Save generated post to `posts` table
- Increment `usage_limits` counter
- Return usage remaining in headers

### 3. app/api/generate-image/route.ts (MODIFY)
**Changes:**
- Add auth check
- Link generated image to post record (if exists)
- Track image generation in usage limits

### 4. app/layout.tsx (MODIFY)
**Changes:**
- Wrap with `<ClerkProvider>`
- Add environment variables for Clerk
- Keep existing global CSS and Toaster

```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="lt">
        <body>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
```

## Data Flow Diagrams

### Authentication Flow
```
User visits site
    ↓
middleware.ts checks session
    ↓
Public route? → Render page
    ↓
Protected route? → auth().protect()
    ↓
No session? → Redirect /sign-in
    ↓
Has session? → Inject user object → Render page
```

### Generation Flow (v2.0)
```
User submits prompt
    ↓
POST /api/generate
    ↓
auth() validates session → userId
    ↓
Query subscriptions table → planType
    ↓
IF planType === 'free':
    Query usage_limits → count
    IF count >= 3 → 429 error
    ↓
Generate text (existing logic)
    ↓
INSERT into posts table
UPDATE usage_limits SET textGenerations = textGenerations + 1
    ↓
Stream response to client
```

### Subscription Flow
```
User clicks "Upgrade"
    ↓
POST /api/checkout
    ↓
stripe.checkout.sessions.create()
    ↓
Redirect to Stripe
    ↓
User pays
    ↓
Stripe webhook → POST /api/webhooks/stripe
    ↓
event.type === 'customer.subscription.created'
    ↓
INSERT into subscriptions table
    (userId, stripeCustomerId, status, planType, etc.)
    ↓
Redirect user to /dashboard
    ↓
Dashboard queries subscriptions table → "Pro Plan"
```

### Post History Flow
```
User visits /dashboard
    ↓
auth() validates session → userId
    ↓
Server Component queries:
    SELECT * FROM posts
    WHERE user_id = $userId
    ORDER BY created_at DESC
    LIMIT 50
    ↓
Render PostCard components
    ↓
User clicks post → View details
    ↓
User clicks "Regenerate" → POST /api/generate (same flow)
```

## Environment Variables Needed

```env
# Existing (v1.0)
OPENAI_API_KEY=sk_xxx
UPSTASH_REDIS_REST_URL=https://xxx
UPSTASH_REDIS_REST_TOKEN=xxx

# New (v2.0)
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
POSTGRES_URL=postgres://xxx
POSTGRES_PRISMA_URL=postgres://xxx  # For migrations
POSTGRES_URL_NON_POOLING=postgres://xxx  # For migrations

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM=price_xxx
```

## Suggested Build Order

### Phase 1: Database Foundation (Week 1)
**Why first:** Everything depends on persistent storage
1. Set up Vercel Postgres
2. Install Drizzle ORM
3. Define schema (users, posts, subscriptions, usage_limits)
4. Create migrations
5. Test database connection in Edge Runtime

**Dependencies:** None
**Blocks:** Phase 2, 3, 4

### Phase 2: Authentication (Week 1-2)
**Why second:** Required before user-specific features
1. Install Clerk
2. Create middleware.ts
3. Set up sign-in/sign-up routes
4. Modify layout.tsx with ClerkProvider
5. Add UserButton to header
6. Test auth flow

**Dependencies:** Phase 1 (users table)
**Blocks:** Phase 3, 4

### Phase 3: Post Saving & History (Week 2)
**Why third:** Core feature, builds on auth + DB
1. Modify `/api/generate` to save posts
2. Modify `/api/generate-image` to link images
3. Create `/dashboard` page
4. Build PostHistory component
5. Add PostCard component
6. Test CRUD operations

**Dependencies:** Phase 1, 2
**Blocks:** None

### Phase 4: Usage Tracking & Limits (Week 2-3)
**Why fourth:** Requires auth + DB, enables monetization
1. Create usage tracking logic
2. Modify `/api/generate` to check limits
3. Add usage increment after success
4. Build UsageStats component
5. Test free tier limits (3/day)

**Dependencies:** Phase 1, 2
**Blocks:** Phase 5

### Phase 5: Stripe Integration (Week 3-4)
**Why last:** Most complex, depends on everything
1. Set up Stripe account + products
2. Create `/api/checkout` route
3. Create `/api/webhooks/stripe` route (Node runtime!)
4. Set up webhook endpoint in Stripe dashboard
5. Test subscription creation flow
6. Build BillingCard component
7. Test upgrade/downgrade/cancel flows
8. Handle edge cases (payment failures, etc.)

**Dependencies:** Phase 1, 2, 4
**Blocks:** None

### Phase 6: UI Polish (Week 4)
**Why final:** Makes everything user-friendly
1. Fix industry selector UX (expand on click)
2. Add CTABanner for anonymous users
3. Add QuickStats to homepage
4. Add loading states for async operations
5. Improve error messages
6. Mobile responsiveness check

**Dependencies:** Phase 1-5
**Blocks:** None

## Migration Path from v1.0 to v2.0

### Backward Compatibility Strategy
**Goal:** v2.0 must support existing anonymous users during transition

#### Option A: Gradual Migration (Recommended)
1. **Week 1-2:** Deploy auth + DB without breaking existing flow
   - Anonymous users continue using site (no changes)
   - Authenticated users can save posts
   - Both paths supported

2. **Week 3:** Add "Sign in to save" prompts
   - Don't block anonymous usage
   - Encourage registration with benefits

3. **Week 4+:** Consider limiting anonymous usage
   - Maybe 1-2 generations/day for anonymous
   - Full 3/day for free tier with account

#### Option B: Hard Cutoff (Not Recommended)
- Require authentication immediately
- Risk losing users who just want to try tool
- Conflicts with "60-second workflow" value prop

**Recommended:** Option A with persistent "Sign up to save posts" banner

## Architecture Anti-Patterns to Avoid

### 1. Auth in Layouts
**Why bad:** Layouts don't re-render on navigation
**Do instead:** Check auth close to data source or in page components

### 2. Storing Sensitive Tokens Client-Side
**Why bad:** XSS vulnerability
**Do instead:** Use HTTP-only cookies (Clerk handles this)

### 3. Hitting Stripe API on Every Request
**Why bad:** Adds latency, rate limits
**Do instead:** Store subscription status locally, sync via webhooks

### 4. Using Edge Runtime for Webhooks
**Why bad:** Cannot parse raw request body for signature verification
**Do instead:** Use `export const runtime = 'nodejs'` for webhook routes

### 5. Relying Only on Middleware for Auth
**Why bad:** CVE-2025-29927, partial rendering issues
**Do instead:** Verify auth at data access layer (in API routes, Server Components)

### 6. Not Indexing Database Queries
**Why bad:** Slow queries as data grows
**Do instead:** Index foreign keys (userId, created_at, date)

### 7. Synchronous Database Writes in Streaming
**Why bad:** Delays streaming response
**Do instead:** Save to DB after streaming completes (or async)

## Performance Considerations

### Edge Runtime Limitations
- **Current:** All API routes use Edge Runtime (25s timeout)
- **New:** Webhook route MUST use Node.js runtime
- **Trade-off:** Node.js has 10s timeout, but webhooks are fast (<1s typically)

### Database Connection Pooling
- Vercel Postgres uses connection pooling
- Drizzle's `@vercel/postgres` driver is edge-compatible
- No persistent connections in Edge (stateless)

### Caching Opportunities
1. **User subscription status:** Cache for 5 minutes (revalidate on webhook)
2. **Post history:** Cache per user, invalidate on new post
3. **Usage limits:** Short TTL (1 minute) to prevent over-generation

## Security Checklist

- [ ] Clerk configured with proper redirect URLs
- [ ] Stripe webhook secret stored securely
- [ ] Database credentials in environment variables only
- [ ] Auth verified at data access layer, not just middleware
- [ ] SQL injection prevented via parameterized queries (Drizzle handles this)
- [ ] Rate limiting still in place for anonymous users
- [ ] CORS configured for Stripe webhooks
- [ ] CSP headers for XSS protection
- [ ] Next.js 15.2.3+ to patch CVE-2025-29927

## Sources

### Authentication & Security
- [Complete Authentication Guide for Next.js App Router in 2025](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)
- [Stop Crying Over Auth: A Senior Dev's Guide to Next.js 15 & Auth.js v5](https://javascript.plainenglish.io/stop-crying-over-auth-a-senior-devs-guide-to-next-js-15-auth-js-v5-42a57bc5b4ce)
- [Auth.js Edge Compatibility](https://authjs.dev/guides/edge-compatibility)
- [Clerk Middleware Documentation](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication)
- [Auth.js Session Management: Protecting Routes](https://authjs.dev/getting-started/session-management/protecting)

### Stripe Integration
- [Stripe Checkout and Webhook in Next.js 15 (2025)](https://medium.com/@gragson.john/stripe-checkout-and-webhook-in-a-next-js-15-2025-925d7529855e)
- [Stripe + Next.js 15: The Complete 2025 Guide](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/)
- [How to Handle Stripe Webhooks in Next.js (The App Router Way)](https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi)
- [Build a Subscriptions Integration - Stripe Documentation](https://docs.stripe.com/billing/subscriptions/build-subscriptions)
- [Designing Database for Subscription - BigBinary](https://www.bigbinary.com/books/handling-stripe-subscriptions/designing-database-for-subscription)

### Database & ORM
- [Drizzle ORM - Drizzle with Vercel Edge Functions](https://orm.drizzle.team/docs/tutorials/drizzle-with-vercel-edge-functions)
- [Drizzle ORM - Vercel Postgres](https://orm.drizzle.team/docs/connect-vercel-postgres)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Deploy to Vercel Edge Functions & Middleware - Prisma](https://www.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-vercel)
- [Database Schema Design for Social Media Applications](https://www.back4app.com/tutorials/how-to-design-a-database-schema-for-a-social-media-application)
- [A Database Design for User Profiles](https://vertabelo.com/blog/user-profile-database-model/)

### Conditional Rendering & Patterns
- [The Art of Conditional Rendering: React and Next.js](https://snyk.io/blog/conditional-rendering-react-next-js/)
- [Authentication and Conditional Routing in Next.js](https://hassanzhd.medium.com/authentication-and-conditional-routing-in-next-js-dc61865aa3c4)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

### Edge Runtime
- [Vercel Edge Runtime Documentation](https://vercel.com/docs/functions/runtimes/edge)
- [Next.js API Reference: Edge Runtime](https://nextjs.org/docs/app/api-reference/edge)
- [Next.js and the Edge Runtime: A Guide for Full-Stack Developers](https://dev.to/waelhabbal/nextjs-and-the-edge-runtime-a-guide-for-full-stack-developers-17g3)
