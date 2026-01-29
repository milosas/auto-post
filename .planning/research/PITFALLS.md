# Pitfalls Research: v2.0 Auth + DB + Payments

**Domain:** Adding authentication, database, and Stripe payments to existing Next.js app
**Context:** Migrating Social Post Generator from anonymous/stateless to authenticated/persistent
**Researched:** 2026-01-29
**Overall confidence:** MEDIUM-HIGH (verified with official docs and recent sources)

---

## Executive Summary

When adding auth, database, and payments to an existing anonymous Next.js app, teams face three critical pitfall categories:

1. **Integration Pitfalls** - Breaking existing anonymous flows when adding authentication
2. **Infrastructure Pitfalls** - Database connection pooling failures in serverless environments
3. **Payment Security Pitfalls** - Race conditions and webhook verification errors

The highest-severity issues are session migration (loses user data), connection pooling mismatches (breaks app in production), and webhook race conditions (double charges/false cancellations).

---

## CRITICAL PITFALLS (Project-Killer)

### P1: Breaking Existing Anonymous Flow When Adding Auth

**Severity:** Project-killer
**Category:** Integration
**Phase:** Authentication implementation (Phase 1-2)

**What goes wrong:**
Users who built habits around the anonymous flow lose access to their workflow. The app forces authentication before allowing tool usage, destroying the core value proposition of "quick, no-signup access."

**Why it happens:**
- Developers add middleware that blocks all routes requiring authentication
- No "try before signup" path preserved
- Session data from anonymous usage gets lost on authentication

**Consequences:**
- Existing users abandon the product (conversion killer)
- Viral growth stops (sharing links now require signup)
- SEO/preview features break (crawlers can't access content)

**Warning signs:**
- Middleware blocks all pages with `matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']`
- No distinction between authenticated-optional vs authenticated-required routes
- LocalStorage/SessionStorage anonymous state not migrated to database on signup

**Prevention:**
1. **Preserve anonymous path** - Core tool functionality remains accessible without auth
2. **Progressive authentication** - Prompt signup AFTER user experiences value (e.g., "Save your design?" prompt after generation)
3. **Session migration strategy** - When anonymous user signs up:
   ```typescript
   // Store anonymous session ID in localStorage
   // On signup/signin, check for pending anonymous data
   // Migrate anonymous_session_id data to authenticated user_id
   ```
4. **Route segmentation**:
   - Public: `/` (landing), `/generate` (tool), `/preview/:id` (sharing)
   - Authenticated: `/dashboard`, `/saved`, `/settings`
   - Premium: `/templates/premium`, `/api/high-res-export`

**Detection:**
- Monitor bounce rate on landing page vs tool page
- Track conversion funnel: anonymous usage → signup
- Alert if middleware blocks crawlers (check User-Agent)

**Sources:**
- [Top 5 authentication solutions for secure Next.js apps in 2026](https://workos.com/blog/top-authentication-solutions-nextjs-2026)
- [Next.js Authentication Best Practices](https://nextjs.org/docs/pages/building-your-application/authentication)

---

### P2: Database Connection Pooling Failure in Serverless/Edge

**Severity:** Project-killer
**Category:** Infrastructure
**Phase:** Database setup (Phase 2)

**What goes wrong:**
Traditional database connection pooling breaks in Next.js Edge Runtime and serverless functions. Each invocation tries to open new connections, exhausting database connection limits and causing "too many connections" errors.

**Why it happens:**
- Edge functions are stateless with no shared connection pool across invocations
- TCP-based databases (PostgreSQL, MySQL) don't work from Edge/Cloudflare Workers
- Connection pooling libraries like `pg` expect persistent Node.js runtime

**Consequences:**
- App works perfectly in development (single long-running process)
- Crashes immediately in production (300+ edge locations × multiple functions = thousands of connections)
- Database refuses new connections → complete outage
- No warning until deployment to Vercel/production environment

**Warning signs:**
- Using Prisma Client with standard `@prisma/client` in Edge Runtime
- Using `pg` or `mysql2` directly in API routes/middleware
- Database config shows max_connections: 100 but app has 50+ serverless functions
- Error: "remaining connection slots are reserved for non-replication superuser connections"

**Prevention:**

**For Edge Runtime:**
1. **Use HTTP-based database drivers**:
   ```typescript
   // DO: HTTP-based (works in Edge)
   import { neon } from '@neondatabase/serverless';
   import { PrismaNeon } from '@prisma/adapter-neon';

   // DON'T: TCP-based (breaks in Edge)
   import { PrismaClient } from '@prisma/client';
   ```

2. **Use managed connection pooling**:
   - **Prisma Accelerate** - Global database cache + connection pooler
   - **Neon Serverless Driver** - HTTP database access
   - **Supabase Pooler** - Connection pooling for PostgreSQL

3. **Route segmentation by runtime**:
   ```typescript
   // middleware.ts - Edge Runtime (thin checks)
   export const config = { runtime: 'edge' };

   // app/api/posts/route.ts - Node Runtime (database queries)
   export const runtime = 'nodejs';
   ```

**For Node.js Serverless:**
1. **Connection pooling with limits**:
   ```typescript
   // Prisma connection limit
   datasource db {
     url = env("DATABASE_URL")
     connectionLimit = 5  // Per function instance
   }
   ```

2. **External pooler** (PgBouncer, Neon, Supabase):
   ```env
   DATABASE_URL="postgresql://user:pass@db.example.com:5432/db"
   DATABASE_POOLER_URL="postgresql://user:pass@pooler.example.com:6543/db"
   ```

**Detection:**
- Load test with 100+ concurrent requests before launch
- Monitor `pg_stat_activity` query in PostgreSQL dashboard
- Set database connection alerts at 70% capacity
- Test on Vercel preview deployment (not just local)

**Sources:**
- [Database access on the Edge with Next.js, Vercel & Prisma Accelerate](https://www.prisma.io/blog/database-access-on-the-edge-8F0t1s1BqOJE)
- [The Problem with Using Databases on the Edge/Serverless](https://dev.to/reggi/the-problem-with-using-databases-on-the-edge-serverless-50fp)
- [Edge Runtime vs Node.js Runtime: When Your Serverless Functions Mysteriously Fail](https://dev.to/pockit_tools/edge-runtime-vs-nodejs-runtime-when-your-serverless-functions-mysteriously-fail-14a)
- [Connection Pooling with Vercel Functions](https://vercel.com/guides/connection-pooling-with-serverless-functions)

---

### P3: Stripe Webhook Race Conditions (Double Charges/False Cancellations)

**Severity:** Project-killer (legal/financial risk)
**Category:** Payments
**Phase:** Stripe integration (Phase 3)

**What goes wrong:**
Stripe sends the same webhook multiple times to guarantee delivery. Without idempotency, webhooks process multiple times causing:
- Users get charged twice for same subscription
- Accounts falsely marked as cancelled
- Credits added multiple times for same payment

**Why it happens:**
- Webhook handler doesn't check if event already processed
- Database race condition: two webhook handlers check "event exists?" simultaneously, both return false, both process
- Idempotency check passes but commit fails, retry processes again

**Consequences:**
- Financial liability (overcharging customers)
- Legal issues (PCI compliance, consumer protection)
- Data corruption (subscription states out of sync with Stripe)
- Customer support nightmare (reconciling payment states)

**Warning signs:**
```typescript
// DANGER: No idempotency check
export async function POST(req: Request) {
  const event = await stripe.webhooks.constructEvent(...);

  if (event.type === 'payment_intent.succeeded') {
    await grantUserAccess(event.data.object.customer);  // Runs multiple times!
  }
}
```

**Prevention:**

**1. Event ID Tracking (Essential)**
```typescript
// CORRECT: Idempotency with database constraint
export async function POST(req: Request) {
  const event = await stripe.webhooks.constructEvent(...);

  // Atomic check + insert with unique constraint
  try {
    await db.webhookEvent.create({
      data: {
        id: event.id,  // Unique constraint on Stripe event ID
        type: event.type,
        processedAt: new Date(),
      }
    });
  } catch (error) {
    if (error.code === 'P2002') {  // Unique constraint violation
      return new Response('Event already processed', { status: 200 });
    }
    throw error;
  }

  // Process event (guaranteed to run once)
  await processStripeEvent(event);
}
```

**2. Database Schema for Idempotency**
```sql
CREATE TABLE webhook_events (
  id VARCHAR(255) PRIMARY KEY,  -- Stripe event ID
  type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_stripe_event_id UNIQUE (id)
);
```

**3. Optimistic Locking for Subscription State**
```typescript
// Prevent race condition on subscription updates
await db.subscription.update({
  where: {
    id: subscriptionId,
    version: currentVersion  // Optimistic locking
  },
  data: {
    status: 'active',
    version: { increment: 1 }
  }
});
```

**4. Queue-Based Processing (Advanced)**
```typescript
// Serialize webhook processing with Redis queue
import { Queue } from 'bullmq';

const webhookQueue = new Queue('stripe-webhooks', {
  connection: redisConnection
});

export async function POST(req: Request) {
  const event = await stripe.webhooks.constructEvent(...);

  // Add to queue (idempotent job ID)
  await webhookQueue.add('process-event', event, {
    jobId: event.id,  // Prevents duplicate jobs
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });

  return new Response('Queued', { status: 200 });
}
```

**Detection:**
- Monitor for duplicate `webhook_events.id` insert errors (should be 0)
- Track subscription state changes: alert if state changes twice within 1 second
- Compare Stripe dashboard event log vs database `webhook_events` count
- Set up Stripe webhook logs monitoring for repeated deliveries

**Sources:**
- [Stripe Webhooks: Solving Race Conditions and Building a Robust Credit Management System](https://www.pedroalonso.net/blog/stripe-webhooks-solving-race-conditions/)
- [The Race Condition You're Probably Shipping Right Now With Stripe Webhooks](https://dev.to/belazy/the-race-condition-youre-probably-shipping-right-now-with-stripe-webhooks-mj4)
- [Building Reliable Stripe Subscriptions: Webhook Idempotency and Optimistic Locking](https://dev.to/aniefon_umanah_ac5f21311c/building-reliable-stripe-subscriptions-in-nestjs-webhook-idempotency-and-optimistic-locking-3o91)
- [Best practices I wish we knew when integrating Stripe webhooks](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks)

---

## MAJOR PITFALLS (Rewrites/Significant Delays)

### P4: Storing Images in Database Instead of Object Storage

**Severity:** Major (cost + performance)
**Category:** Database Design
**Phase:** Database setup (Phase 2)

**What goes wrong:**
Developers store generated images as BLOBs in PostgreSQL/MySQL database. Database size explodes, costs skyrocket, query performance degrades, and backups become unmanageable.

**Why it happens:**
- "It's simpler to keep everything in one place"
- Avoiding S3 API complexity initially
- Not calculating storage costs accurately

**Consequences:**
- **Cost explosion**: PostgreSQL storage is 10-50x more expensive than S3
  - Example: 10,000 users × 50 images × 200KB = 100GB
  - Database storage: $100-300/month (depending on provider)
  - S3 Standard storage: $2.30/month (100GB × $0.023/GB)
- **Performance degradation**: Queries slow down as table size grows
- **Backup costs**: Database backups include image BLOBs (expensive, slow)
- **Migration pain**: Moving images out of database later requires rewrite

**Warning signs:**
```typescript
// DANGER: Storing images in database
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  image_data BYTEA,  // Image stored directly in database
  created_at TIMESTAMP
);
```

**Prevention:**

**1. Store images in object storage, references in database**
```typescript
// CORRECT: Object storage with database reference
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  image_url TEXT,  // S3/R2 URL only (100 bytes)
  storage_key TEXT,  // For deletion
  created_at TIMESTAMP
);

// Upload flow
const key = `posts/${userId}/${postId}.png`;
await s3.putObject({ Bucket: 'app-images', Key: key, Body: imageBuffer });

await db.post.create({
  data: {
    userId,
    imageUrl: `https://cdn.example.com/${key}`,
    storageKey: key
  }
});
```

**2. Choose cost-effective storage tier**
- **S3 Standard**: Frequently accessed images (user dashboards) - $0.023/GB/month
- **S3 Intelligent-Tiering**: Mixed access patterns (archive old posts) - Auto-optimizes
- **Cloudflare R2**: No egress fees (good for public sharing) - $0.015/GB/month
- **Backblaze B2**: Cheapest option - $0.005/GB/month

**3. Lifecycle policies for cost control**
```typescript
// Delete generated images after 90 days if not saved
const lifecycleRule = {
  Rules: [{
    Id: 'delete-temporary-posts',
    Filter: { Prefix: 'posts/temp/' },
    Status: 'Enabled',
    Expiration: { Days: 90 }
  }]
};
```

**4. CDN for performance**
```typescript
// CloudFront/Cloudflare CDN in front of S3
// Reduces origin requests by 95%+
const imageUrl = `https://cdn.example.com/${storageKey}`;
```

**Cost comparison (10,000 users, 50 images each, 200KB avg):**
| Storage Solution | Monthly Cost | Notes |
|------------------|--------------|-------|
| PostgreSQL (Neon) | $100-200 | Includes compute, limited storage |
| PostgreSQL (RDS) | $300+ | Separate storage pricing |
| S3 Standard | $2.30 | 100GB × $0.023/GB |
| S3 + CloudFront | $3.50 | +$1.20 for CDN requests |
| Cloudflare R2 | $1.50 | Free egress |

**Detection:**
- Monitor database size growth (alert if >10GB/week unexpected growth)
- Check top tables by size: `SELECT pg_size_pretty(pg_total_relation_size('posts'));`
- Review query performance for image-heavy tables

**Sources:**
- [Storing Images: Database vs Filesystem – Pros, Cons & Best Practices](https://www.codegenes.net/blog/storing-images-in-a-database-versus-a-filesystem/)
- [AWS S3 Storage Classes: 2026 Cost Optimization Roadmap](https://costimizer.ai/blogs/aws-s3-storage)
- [Cloud Storage Pricing Comparison: AWS S3, GCP, Azure, and B2](https://www.backblaze.com/cloud-storage/pricing)
- [The Cost Structure of Using Nextjs Image](https://indie-starter.dev/blog/the-cost-of-using-nextjs-image)

---

### P5: OAuth Provider Approval Process Delays Launch

**Severity:** Major (timeline risk)
**Category:** Authentication
**Phase:** OAuth setup (Phase 1)

**What goes wrong:**
Teams underestimate OAuth app review timelines. Google OAuth verification takes 3-7 days (or weeks for restricted scopes), Facebook app review requires 6+ resubmissions, and incomplete applications cause rejection loops.

**Why it happens:**
- "We'll handle OAuth approval during launch week" (too late)
- Missing required documentation (privacy policy, terms of service)
- Poor quality app review submissions (low-res screenshots, unclear descriptions)
- Not understanding platform-specific requirements

**Consequences:**
- Launch delayed 2-4 weeks waiting for approval
- Users can't sign up with Google/Facebook (major conversion blocker)
- App stuck in "testing" mode with 100-user limit
- Multiple rejection cycles extend delays

**Warning signs:**
- Privacy policy link points to non-existent page
- OAuth consent screen set to "Internal" or "Testing" status
- Missing live demo URL for app reviewers
- Screenshots don't show actual OAuth permission usage
- No terms of service URL

**Prevention:**

**1. Start OAuth approval 2-3 weeks before launch**
```markdown
Timeline:
Week -3: Submit initial OAuth applications
Week -2: Address rejection feedback, resubmit
Week -1: Final approval, test in production mode
Week 0: Launch with OAuth working
```

**2. Google OAuth Verification Requirements**
```typescript
// Required documentation before submission
const requirements = {
  privacyPolicy: 'https://example.com/privacy',  // Must be live, accessible
  termsOfService: 'https://example.com/terms',
  homepageURL: 'https://example.com',

  // OAuth Consent Screen
  appName: 'Social Post Generator',
  appLogo: 'logo.png',  // 120x120px minimum
  supportEmail: 'support@example.com',
  scopes: [
    'openid',
    'email',
    'profile'
    // DON'T request unnecessary scopes (red flag)
  ],

  // App review submission
  scopeJustification: 'We use email scope to create user accounts and send...',
  youtubeVideoDemo: 'https://youtube.com/demo',  // Show OAuth flow
  screenshots: [
    'oauth-consent-screen.png',  // High quality (1920x1080)
    'after-login-dashboard.png'
  ]
};
```

**3. Facebook App Review Requirements**
```typescript
// Required for Facebook Login permission
const facebookReview = {
  // Must provide live demo
  testUser: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  },

  // Screencast video showing:
  steps: [
    'User clicks "Login with Facebook"',
    'Facebook login dialog appears',
    'User grants permission',
    'User redirects to dashboard with Facebook data'
  ],

  // Common rejection reasons to avoid:
  avoidances: [
    'DON\'T submit PDF instructions (rejected)',
    'DON\'T require reviewer to submit data (they won\'t)',
    'DON\'T use low-quality screenshots',
    'DO show actual working feature in video'
  ]
};
```

**4. Development Mode Workarounds (During Approval)**
```typescript
// Allow testing with test users while waiting for approval
// Google: Add test users in OAuth consent screen
const testUsers = [
  'developer@example.com',
  'tester1@example.com'
  // Up to 100 test users allowed
];

// Facebook: Add test users in App Roles
// Can test all features without approval
```

**5. Common Rejection Reasons Checklist**
- [ ] Privacy policy URL returns 404 or generic template
- [ ] Privacy policy doesn't mention OAuth data usage
- [ ] App description too vague ("Login with Google")
- [ ] Screenshots are low quality or don't show feature
- [ ] Scope justification insufficient ("We need email to identify users")
- [ ] Homepage URL is localhost or non-HTTPS
- [ ] Video demo doesn't show actual OAuth flow
- [ ] App is set to "Internal" instead of "External"

**Detection:**
- Set calendar reminder 3 weeks before launch to start OAuth submissions
- Monitor OAuth application status weekly
- Test with non-developer accounts to verify approval status

**Sources:**
- [How to Pass Google OAuth Verification for Workspace Add-ons (My Full 2025 Guide)](https://medium.com/@info.brightconstruct/the-real-oauth-journey-getting-a-google-workspace-add-on-verified-fc31bc4c9858)
- [Google OAuth Developer Reviews Explained](https://www.cloudsponge.com/blog/google-oauth-reviews/)
- [Navigating the Facebook App Review Process](https://dancerscode.com/posts/navigating-the-facebook-app-review-process/)
- [Comply with OAuth 2.0 policies](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)

---

### P6: Session/Cache Poisoning Across Users

**Severity:** Major (security + data leak)
**Category:** Authentication + Database
**Phase:** Authentication + caching implementation (Phase 1-2)

**What goes wrong:**
Cache keys don't include user identifiers. User A's dashboard shows User B's data because both hit the same cache key.

**Why it happens:**
- Migrating from anonymous (single cache for everyone) to authenticated (per-user cache)
- Cache key like `dashboard_posts` instead of `user_${userId}_dashboard_posts`
- Next.js route caching doesn't account for user session

**Consequences:**
- **Data leaks**: Users see other users' private data
- **PCI/Privacy violations**: GDPR, CCPA violations if sensitive data exposed
- **Trust destruction**: Users discover the leak, PR disaster

**Warning signs:**
```typescript
// DANGER: Cache not scoped to user
export async function GET(req: Request) {
  const posts = await redis.get('dashboard_posts');  // Same for all users!
  if (posts) return Response.json(posts);

  const session = await getSession(req);
  const freshPosts = await db.post.findMany({
    where: { userId: session.userId }
  });
  await redis.set('dashboard_posts', freshPosts);  // Overwrites previous user's cache
  return Response.json(freshPosts);
}
```

**Prevention:**

**1. Always scope cache keys by user**
```typescript
// CORRECT: User-scoped cache key
export async function GET(req: Request) {
  const session = await getSession(req);
  const cacheKey = `user:${session.userId}:dashboard_posts`;

  const cached = await redis.get(cacheKey);
  if (cached) return Response.json(cached);

  const posts = await db.post.findMany({
    where: { userId: session.userId }
  });
  await redis.set(cacheKey, posts, { ex: 300 });  // 5 min TTL
  return Response.json(posts);
}
```

**2. Next.js Route Segment Config**
```typescript
// app/dashboard/page.tsx
export const dynamic = 'force-dynamic';  // Prevent static caching of user data
export const revalidate = 0;  // Never cache authenticated routes
```

**3. Cache Invalidation on Mutations**
```typescript
// When user updates data, invalidate their cache
export async function updateProfile(userId: string, data: ProfileData) {
  await db.user.update({ where: { id: userId }, data });

  // Invalidate user-specific caches
  await redis.del(`user:${userId}:profile`);
  await redis.del(`user:${userId}:dashboard_posts`);

  // Pattern-based invalidation
  const keys = await redis.keys(`user:${userId}:*`);
  if (keys.length) await redis.del(...keys);
}
```

**4. Testing Cross-User Isolation**
```typescript
// Test: User A should never see User B's data
test('cache isolation between users', async () => {
  const userA = await createUser({ email: 'a@test.com' });
  const userB = await createUser({ email: 'b@test.com' });

  const postA = await createPost({ userId: userA.id, content: 'Secret A' });
  const postB = await createPost({ userId: userB.id, content: 'Secret B' });

  // User A fetches dashboard
  const responseA = await fetch('/api/dashboard', {
    headers: { cookie: userA.sessionCookie }
  });
  const dataA = await responseA.json();

  // User B fetches dashboard
  const responseB = await fetch('/api/dashboard', {
    headers: { cookie: userB.sessionCookie }
  });
  const dataB = await responseB.json();

  // Assert no cross-contamination
  expect(dataA.posts).toContainEqual(postA);
  expect(dataA.posts).not.toContainEqual(postB);
  expect(dataB.posts).toContainEqual(postB);
  expect(dataB.posts).not.toContainEqual(postA);
});
```

**Detection:**
- Integration tests with multiple concurrent users
- Monitoring: Alert if same cache key accessed by different userIds within 1 second
- Manual QA: Log in as User A and User B simultaneously, verify data isolation

**Sources:**
- [Next.js App Router: common mistakes and how to fix them](https://upsun.com/blog/avoid-common-mistakes-with-next-js-app-router/)
- [NextAuth.js: Secure Authentication for Next.js Apps](https://strapi.io/blog/nextauth-js-secure-authentication-next-js-guide)

---

### P7: Stripe Webhook Signature Verification Failure in Production

**Severity:** Major (security + payments broken)
**Category:** Payments
**Phase:** Stripe webhook implementation (Phase 3)

**What goes wrong:**
Webhooks work perfectly in development but fail signature verification in production with error: "No signatures found matching the expected signature for payload."

**Why it happens:**
- Body parsing middleware modifies raw request body before signature verification
- Wrong webhook secret (test vs live mode secret)
- Using `NEXT_PUBLIC_` prefix for webhook secret (exposes to client)
- Request body encoding changed by framework

**Consequences:**
- All webhooks rejected → payments succeed but users never get access
- Subscriptions created in Stripe but not reflected in database
- No visibility into webhook failures without monitoring

**Warning signs:**
```typescript
// DANGER: Body already parsed (breaks signature verification)
export async function POST(req: Request) {
  const body = await req.json();  // Parses body first
  const signature = req.headers.get('stripe-signature');

  // FAILS: Body already consumed/modified
  const event = stripe.webhooks.constructEvent(
    body,  // Should be raw body, but it's parsed JSON
    signature,
    webhookSecret
  );
}
```

**Prevention:**

**1. Get Raw Body (Next.js App Router)**
```typescript
// CORRECT: Get raw body before parsing
export async function POST(req: Request) {
  const body = await req.text();  // Raw string body
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!  // NOT NEXT_PUBLIC_
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Process event
  await handleStripeEvent(event);
  return new Response('Success', { status: 200 });
}
```

**2. Get Raw Body (Pages Router)**
```typescript
// pages/api/webhooks/stripe.ts
import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,  // CRITICAL: Disable body parser
  },
};

export default async function handler(req, res) {
  const buf = await buffer(req);  // Raw buffer
  const signature = req.headers['stripe-signature'];

  const event = stripe.webhooks.constructEvent(
    buf,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  await handleStripeEvent(event);
  res.status(200).json({ received: true });
}
```

**3. Separate Webhook Secrets for Test/Live Mode**
```env
# .env.local
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...  # Test mode secret

# .env.production
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...  # Live mode secret (DIFFERENT!)
```

**4. Test Webhook Locally with Stripe CLI**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

**5. Production Webhook Setup Checklist**
- [ ] Webhook endpoint registered in Stripe Dashboard (Live mode)
- [ ] Live webhook secret added to production environment variables
- [ ] Webhook secret DOES NOT use `NEXT_PUBLIC_` prefix
- [ ] Body parser disabled or raw body extracted before parsing
- [ ] Webhook URL is HTTPS (not HTTP)
- [ ] Webhook endpoint returns 2xx response within 5 seconds
- [ ] Event types subscribed: `payment_intent.succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

**Detection:**
- Monitor Stripe Dashboard > Developers > Webhooks > View logs
- Set up alerts for webhook failures (Stripe sends email after repeated failures)
- Log signature verification errors with full error message
- Test production webhook with `stripe trigger` before launch

**Sources:**
- [Stripe Checkout and Webhook in a Next.js 15 (2025)](https://medium.com/@gragson.john/stripe-checkout-and-webhook-in-a-next-js-15-2025-925d7529855e)
- [Debugging Stripe Webhook Signature Verification Errors in Production](https://dev.to/nerdincode/debugging-stripe-webhook-signature-verification-errors-in-production-1h7c)
- [How to Handle Stripe Webhooks in Next.js (The App Router Way)](https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi)
- [Handle different modes | Stripe Documentation](https://docs.stripe.com/stripe-apps/handling-modes)

---

## MODERATE PITFALLS (Technical Debt/User Friction)

### P8: Next.js Image Optimization Costs Spiral Out of Control

**Severity:** Moderate (cost)
**Category:** Infrastructure
**Phase:** Image handling (Phase 2)

**What goes wrong:**
Vercel charges per image optimization. App with 10,000 monthly visitors × 10 images per page = 100,000 optimizations = $95/month in image optimization alone (on top of hosting).

**Why it happens:**
- Using Next.js `<Image>` component without understanding pricing model
- Not leveraging CDN caching effectively
- Generating multiple image variants on demand

**Consequences:**
- Vercel bill jumps from $20/month (Pro plan) to $500+/month
- Optimizations don't cache properly (re-optimizing same images)

**Prevention:**
1. **Use external image optimization**:
   - Cloudflare Images: $5/month for 100,000 images
   - Cloudinary free tier: 25,000 transformations/month
   - imgix: $0.008 per 1,000 optimizations

2. **Self-host with AWS Lambda**:
   ```typescript
   // AWS Lambda + S3: ~$0.02 per 1,000 optimizations
   // 50,000 free tier images/month
   ```

3. **Aggressive CDN caching**:
   ```typescript
   // next.config.js
   images: {
     minimumCacheTTL: 31536000,  // 1 year
     deviceSizes: [640, 750, 828, 1080, 1200],  // Limit variants
     formats: ['webp'],  // Single format (not webp + avif)
   }
   ```

**Sources:**
- [The Cost Structure of Using Nextjs Image](https://indie-starter.dev/blog/the-cost-of-using-nextjs-image)
- [Cutting Vercel Costs by 80%](https://www.howdygo.com/blog/cutting-howdygos-vercel-costs-by-80-without-compromising-ux-or-dx)

---

### P9: Auth Library Lock-in and Migration Pain

**Severity:** Moderate (flexibility)
**Category:** Authentication
**Phase:** Auth library selection (Phase 1)

**What goes wrong:**
Teams choose Clerk for rapid development, then need features Clerk doesn't support (custom OAuth provider, specific session management). Migration to different auth system requires rewriting entire authentication layer.

**Why it happens:**
- Choosing "easiest" solution without evaluating long-term needs
- Not understanding vendor lock-in trade-offs
- Auth.js (NextAuth) v4→v5 migration breaking changes

**Consequences:**
- Stuck with vendor limitations (Clerk rate limits, pricing tiers)
- Major refactor needed to switch auth providers
- User session migration during provider switch

**Prevention:**
1. **Evaluate auth needs upfront**:
   ```typescript
   const authRequirements = {
     providers: ['Google', 'Facebook', 'Email/Password'],
     customization: 'Medium',  // Custom UI vs pre-built
     userManagement: 'In-app',  // vs external dashboard
     cost: 'Low',  // Free tier vs paid
     portability: 'High'  // Can migrate away easily
   };
   ```

2. **Auth library comparison for Social Post Generator**:
   | Library | Setup Time | Cost | Customization | Lock-in | Recommendation |
   |---------|------------|------|---------------|---------|----------------|
   | **Clerk** | 5 min | $25/month (1,000 MAU) | Low | High | Good for MVP, risky long-term |
   | **Auth.js** | 30 min | $0 | High | Medium | Best balance |
   | **Better Auth** | 20 min | $0 | Very High | Low | Best for custom needs |
   | **Supabase Auth** | 15 min | $0-25/month | Medium | Medium | Good if using Supabase DB |

3. **Recommendation for v2.0**: **Auth.js (NextAuth v5)** or **Better Auth**
   - Open source (no vendor lock-in)
   - Free (database is only cost)
   - Supports Google/Facebook OAuth
   - Full control over session management
   - Can migrate anonymous users to authenticated

**Sources:**
- [NextAuth.js vs Clerk vs Auth.js — Which Is Best for Your Next.js App in 2025?](https://chhimpashubham.medium.com/nextauth-js-vs-clerk-vs-auth-js-which-is-best-for-your-next-js-app-in-2025-fc715c2ccbfd)
- [Clerk vs Kinde vs Better Auth: How to Choose the Right Next.js Authentication Library](https://www.freecodecamp.org/news/how-to-choose-the-right-nextjs-authentication-library/)
- [BetterAuth vs NextAuth: Choose the Right Auth Library for Your SaaS](https://www.devtoolsacademy.com/blog/betterauth-vs-nextauth/)

---

### P10: Free Tier Abuse Without Rate Limiting

**Severity:** Moderate (cost + abuse)
**Category:** Infrastructure
**Phase:** Launch (Phase 4)

**What goes wrong:**
No rate limiting on anonymous or free tier users. Malicious actors generate thousands of images, exhausting API quotas (OpenAI, image generation) and driving up costs.

**Why it happens:**
- "We'll add rate limiting after we have users" (too late)
- Trusting users not to abuse system
- Not understanding serverless invocation costs

**Consequences:**
- $5,000 OpenAI bill in first week (happened to multiple startups)
- API keys revoked for suspicious activity
- Service degraded for legitimate users

**Prevention:**

**1. Rate Limiting by IP (Anonymous Users)**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),  // 10 requests per hour
  analytics: true,
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { success, limit, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Rate limit exceeded. Sign up for more generations.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
      }
    });
  }

  // Process request
}
```

**2. Tiered Rate Limits**
```typescript
const limits = {
  anonymous: { requests: 5, window: '1 h' },
  free: { requests: 50, window: '1 d' },
  pro: { requests: 500, window: '1 d' },
  enterprise: { requests: 10000, window: '1 d' },
};

async function getRateLimit(userId?: string) {
  if (!userId) return limits.anonymous;

  const user = await db.user.findUnique({ where: { id: userId } });
  return limits[user.tier];
}
```

**3. Cost-Based Rate Limiting**
```typescript
// Track API costs per user
await db.usage.create({
  data: {
    userId,
    action: 'generate_image',
    cost: 0.02,  // OpenAI API cost per generation
    createdAt: new Date()
  }
});

// Check monthly spend
const monthlySpend = await db.usage.aggregate({
  where: {
    userId,
    createdAt: { gte: startOfMonth(new Date()) }
  },
  _sum: { cost: true }
});

if (monthlySpend._sum.cost > user.monthlyLimit) {
  throw new Error('Monthly limit reached. Upgrade to continue.');
}
```

**4. Upstash Redis Free Tier**
- 10,000 requests/day free
- Perfect for rate limiting small apps
- Upgrade to $0.2 per 100,000 requests when scaling

**Sources:**
- [How to Implement Rate Limiting in Next.js](https://peerlist.io/blog/engineering/how-to-implement-rate-limiting-in-nextjs)
- [4 Best Rate Limiting Solutions for Next.js Apps](https://dev.to/ethanleetech/4-best-rate-limiting-solutions-for-nextjs-apps-2024-3ljj)
- [The Complete Rate Limiting Handbook](https://saascustomdomains.com/blog/posts/the-complete-rate-limiting-handbook-prevent-abuse-and-optimize-performance)

---

## INTEGRATION-SPECIFIC PITFALLS

### P11: Losing Anonymous User Data on Authentication

**Severity:** Moderate (UX)
**Category:** Integration
**Phase:** Auth + data migration (Phase 1-2)

**What goes wrong:**
User generates 5 designs anonymously, signs up, and all their work disappears because anonymous session data wasn't migrated to authenticated account.

**Why it happens:**
- No temporary storage for anonymous user data
- No migration strategy from anonymous → authenticated
- localStorage data not transferred to database on signup

**Consequences:**
- User frustration ("Where did my designs go?")
- Reduced conversion (users don't sign up if they lose work)

**Prevention:**

**1. Anonymous Session ID in LocalStorage**
```typescript
// utils/session.ts
export function getOrCreateAnonymousId(): string {
  let anonId = localStorage.getItem('anonymous_session_id');
  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem('anonymous_session_id', anonId);
  }
  return anonId;
}
```

**2. Store Anonymous Data with Session ID**
```typescript
// API: Create post anonymously
export async function POST(req: Request) {
  const { imageUrl, anonymousId } = await req.json();

  await db.post.create({
    data: {
      imageUrl,
      anonymousSessionId: anonymousId,  // NOT userId (null)
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 days
    }
  });
}
```

**3. Migration on Signup**
```typescript
// After successful signup
export async function migrateAnonymousData(userId: string, anonymousId: string) {
  // Move anonymous posts to user account
  await db.post.updateMany({
    where: { anonymousSessionId: anonymousId },
    data: {
      userId,
      anonymousSessionId: null,
      expiresAt: null  // Remove expiration
    }
  });

  console.log(`Migrated anonymous data for session ${anonymousId} to user ${userId}`);
}

// In signup flow
const user = await createUser({ email, password });
const anonId = req.headers.get('x-anonymous-id');  // From client
if (anonId) await migrateAnonymousData(user.id, anonId);
```

**4. Prompt User to Save Work**
```typescript
// UI: Show prompt after generating 3+ designs
if (anonymousGenerationCount >= 3) {
  showModal({
    title: 'Save your designs?',
    message: 'Sign up to keep your work forever and unlock premium features.',
    cta: 'Sign Up',
    onSignup: async () => {
      // Pass anonymous ID to signup flow
      router.push(`/signup?anonId=${getOrCreateAnonymousId()}`);
    }
  });
}
```

**Detection:**
- Track conversion funnel: anonymous usage → signup → retained data
- Survey users: "Did you find your previous designs after signing up?"

**Sources:**
- [Automatic Session Linking/Identity Stitching](https://github.com/umami-software/umami/issues/3820)

---

### P12: Gradual Rollout Breaking for Existing Users

**Severity:** Moderate (UX)
**Category:** Integration
**Phase:** Feature rollout (Phase 4)

**What goes wrong:**
Using feature flags for gradual authentication rollout causes inconsistent experience: user sees "Sign Up" button on one visit, doesn't see it on next visit (fell out of rollout percentage).

**Why it happens:**
- Feature flag percentage-based rollout without user ID stickiness
- Anonymous users don't have stable identifier for consistent flagging

**Consequences:**
- User confusion ("I saw a premium feature earlier, now it's gone")
- Can't reproduce bugs (feature state changes between requests)
- A/B test results polluted (users see both variants)

**Prevention:**

**1. User ID-Based Stickiness**
```typescript
import { unstable_flag as flag } from '@vercel/flags/next';

export const authFeatureFlag = flag({
  key: 'auth-rollout',
  decide: async () => {
    const session = await getSession();
    const userId = session?.userId ?? getOrCreateAnonymousId();

    // Hash user ID to percentage (0-100)
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(userId)
    );
    const percentage = new DataView(hash).getUint32(0) % 100;

    // Enable for first 20% of users (by hashed user ID)
    return percentage < 20;
  }
});
```

**2. Gradual Rollout Schedule**
```typescript
// Phase 1: Internal team (day 1)
if (user.email.endsWith('@company.com')) return true;

// Phase 2: 5% of users (day 3)
if (hash < 5) return true;

// Phase 3: 20% of users (day 5)
if (hash < 20) return true;

// Phase 4: 50% of users (day 7)
if (hash < 50) return true;

// Phase 5: 100% of users (day 10)
return true;
```

**3. Feature Flag with Database Override**
```typescript
// Allow manually enabling feature for specific users
const override = await db.featureFlag.findUnique({
  where: { userId_feature: { userId, feature: 'auth-rollout' } }
});

if (override?.enabled) return true;

// Fall back to percentage rollout
return hashBasedRollout(userId);
```

**Sources:**
- [Feature flag use cases: progressive or gradual rollouts](https://www.getunleash.io/feature-flag-use-cases-progressive-or-gradual-rollouts)
- [11 principles for building and scaling feature flag systems](https://docs.getunleash.io/guides/feature-flag-best-practices)
- [Feature Flag Best Practices](https://frontegg.com/blog/feature-flag-best-practices)

---

### P13: Stripe Test Mode vs Live Mode Confusion

**Severity:** Moderate (launch blocker)
**Category:** Payments
**Phase:** Stripe testing (Phase 3)

**What goes wrong:**
Webhooks work in test mode but not in production. Realized too late that test webhook endpoint ≠ live webhook endpoint, and live mode requires separate configuration.

**Why it happens:**
- Assuming test mode configuration carries over to live mode
- Not reading Stripe's test-to-live migration checklist
- Using same webhook endpoint for both modes

**Consequences:**
- Launch day: payments succeed but webhooks fail
- Users pay but don't get access
- Manual reconciliation needed

**Prevention:**

**1. Separate Webhook Endpoints (Recommended)**
```typescript
// Development: Test mode webhook
POST https://example.com/api/webhooks/stripe-test
// Uses STRIPE_WEBHOOK_SECRET_TEST

// Production: Live mode webhook
POST https://example.com/api/webhooks/stripe
// Uses STRIPE_WEBHOOK_SECRET_LIVE
```

**2. Single Endpoint with Mode Detection**
```typescript
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  // Try live mode first
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_LIVE!
    );
  } catch {
    // Fall back to test mode
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET_TEST!
      );
    } catch (err) {
      return new Response('Invalid signature', { status: 400 });
    }
  }

  // Check livemode property
  if (event.livemode) {
    await processLiveEvent(event);
  } else {
    await processTestEvent(event);
  }
}
```

**3. Pre-Launch Checklist**
- [ ] Test mode products created (e.g., "Pro Plan - Test")
- [ ] Live mode products created (e.g., "Pro Plan")
- [ ] Test webhook endpoint registered in Stripe Dashboard (Test mode)
- [ ] Live webhook endpoint registered in Stripe Dashboard (Live mode)
- [ ] Test webhook secret in `.env.local`
- [ ] Live webhook secret in production environment variables
- [ ] Test payment with card `4242 4242 4242 4242` (test mode)
- [ ] Live payment with real card (live mode) in staging environment
- [ ] Webhook logs show successful delivery in both modes

**4. Stripe Go-Live Checklist (Official)**
- Activate your Stripe account (provide business details)
- Request higher rate limits if needed
- Switch API keys from test to live
- Create live mode products/prices
- Register live mode webhook endpoints
- Update environment variables
- Test with real payment method in staging
- Monitor webhook logs after launch

**Sources:**
- [Handle different modes | Stripe Documentation](https://docs.stripe.com/stripe-apps/handling-modes)
- [Go-live checklist | Stripe Documentation](https://docs.stripe.com/get-started/checklist/go-live)
- [Stripe Webhooks, Live Mode](https://docs.blackthorn.io/docs/payments-deploy-production-stripe-webhooks-live-mode)

---

## MINOR PITFALLS (Annoyances)

### P14: Email Verification Blocking User Onboarding

**Severity:** Minor (UX friction)
**Category:** Authentication
**Phase:** Auth implementation (Phase 1)

**What goes wrong:**
Requiring email verification before allowing app access creates unnecessary friction. User signs up, excited to use app, gets redirected to "Check your email" page, never returns.

**Consequences:**
- 30-50% signup abandonment
- Email goes to spam folder
- User loses interest waiting for verification

**Prevention:**
1. **Progressive verification**: Allow app access immediately, prompt verification later
2. **Verify on first action**: Send verification email but don't block access
3. **Clear value**: "Verify email to save your designs permanently"

---

### P15: Database Migration Rollback Failure

**Severity:** Minor (downtime)
**Category:** Database
**Phase:** Schema changes (Phase 2+)

**What goes wrong:**
Prisma migration breaks production database schema. Rollback fails because migration already partially applied.

**Prevention:**
1. **Test migrations in staging** with production data snapshot
2. **Backup before migrations**: `pg_dump` before running migrations
3. **Idempotent migrations**: Use `IF NOT EXISTS` clauses
4. **Shadow database**: Prisma's shadow database for migration validation

---

## RESEARCH GAPS & PHASE-SPECIFIC FLAGS

### Areas Requiring Deeper Research During Implementation

| Phase | Topic | Why Needs Research | Priority |
|-------|-------|-------------------|----------|
| Phase 1 | Auth.js v5 vs Better Auth API comparison | Rapid evolution, need current API docs | HIGH |
| Phase 2 | Neon vs Supabase serverless database pricing | Pricing models change frequently | MEDIUM |
| Phase 3 | Stripe Checkout vs Payment Links | Feature set differs, need use-case match | MEDIUM |
| Phase 4 | Upstash Redis pricing at scale | Free tier limits need verification | LOW |

### Topics with LOW Confidence (Needs Verification)

1. **Anonymous session migration patterns** - Limited authoritative sources found (only GitHub issue)
2. **Better Auth production stability** - New library (2025), limited production usage data
3. **Next.js 15/16 App Router caching behavior with auth** - Behavior changes between versions

---

## PHASE RECOMMENDATIONS

### Phase 1: Authentication (High Risk)
**Critical pitfalls to address:**
- P1: Breaking anonymous flow (MUST preserve)
- P5: OAuth approval delays (start 3 weeks early)
- P6: Cache poisoning (test user isolation)

**Research needed:**
- Auth.js v5 vs Better Auth (LOW confidence on API stability)
- Session migration strategy (LOW confidence, sparse documentation)

---

### Phase 2: Database (High Risk)
**Critical pitfalls to address:**
- P2: Connection pooling failure (test edge runtime early)
- P4: Image storage in database (use S3 from day 1)
- P6: Cache key scoping (implement user-scoped cache)

**Research needed:**
- Neon serverless vs Supabase pricing at scale
- Prisma Accelerate necessity for edge runtime

---

### Phase 3: Payments (Highest Risk)
**Critical pitfalls to address:**
- P3: Webhook race conditions (implement idempotency first)
- P7: Webhook signature verification (test production webhook before launch)
- P13: Test vs live mode confusion (separate endpoints)

**Research needed:**
- Stripe Checkout vs Payment Links for SaaS subscriptions
- Webhook idempotency implementation patterns (multiple patterns found, need to choose)

---

### Phase 4: Launch (Moderate Risk)
**Critical pitfalls to address:**
- P10: Free tier abuse (rate limiting required)
- P8: Image optimization costs (evaluate alternatives)
- P12: Gradual rollout consistency (user-based feature flags)

---

## CONFIDENCE ASSESSMENT

| Pitfall Category | Research Confidence | Source Quality | Verification Status |
|------------------|---------------------|----------------|---------------------|
| Stripe webhooks | HIGH | Official docs + recent blog posts | Verified with Stripe docs |
| Database connection pooling | HIGH | Official Prisma/Vercel docs | Verified with Prisma docs |
| OAuth approval | MEDIUM-HIGH | Community posts (2025) | Verified with Google/Facebook docs |
| Session migration | LOW | Single GitHub issue | Needs official documentation |
| Auth library comparison | MEDIUM | Multiple comparison posts (2025) | Cross-referenced 3+ sources |
| Image storage costs | HIGH | Official AWS/Vercel pricing | Verified with pricing pages |
| Rate limiting | HIGH | Library docs + tutorials | Verified with Upstash docs |

---

## SOURCES

### Authentication
- [Top 5 authentication solutions for secure Next.js apps in 2026](https://workos.com/blog/top-authentication-solutions-nextjs-2026)
- [NextAuth.js: Secure Authentication for Next.js Apps](https://strapi.io/blog/nextauth-js-secure-authentication-next-js-guide)
- [Next.js Authentication Guide](https://nextjs.org/docs/pages/building-your-application/authentication)
- [NextAuth.js vs Clerk vs Auth.js — Which Is Best for Your Next.js App in 2025?](https://chhimpashubham.medium.com/nextauth-js-vs-clerk-vs-auth-js-which-is-best-for-your-next-js-app-in-2025-fc715c2ccbfd)
- [Clerk vs Supabase Auth vs NextAuth.js: The Production Reality](https://medium.com/better-dev-nextjs-react/clerk-vs-supabase-auth-vs-nextauth-js-the-production-reality-nobody-tells-you-a4b8f0993e1b)
- [BetterAuth vs NextAuth: Choose the Right Auth Library for Your SaaS](https://www.devtoolsacademy.com/blog/betterauth-vs-nextauth/)

### OAuth Provider Approval
- [How to Pass Google OAuth Verification (My Full 2025 Guide)](https://medium.com/@info.brightconstruct/the-real-oauth-journey-getting-a-google-workspace-add-on-verified-fc31bc4c9858)
- [Google OAuth Developer Reviews Explained](https://www.cloudsponge.com/blog/google-oauth-reviews/)
- [Navigating the Facebook App Review Process](https://dancerscode.com/posts/navigating-the-facebook-app-review-process/)
- [Comply with OAuth 2.0 policies](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)

### Database
- [Next.js App Router: common mistakes and how to fix them](https://upsun.com/blog/avoid-common-mistakes-with-next-js-app-router/)
- [Database access on the Edge with Next.js, Vercel & Prisma Accelerate](https://www.prisma.io/blog/database-access-on-the-edge-8F0t1s1BqOJE)
- [The Problem with Using Databases on the Edge/Serverless](https://dev.to/reggi/the-problem-with-using-databases-on-the-edge-serverless-50fp)
- [Edge Runtime vs Node.js Runtime: When Your Serverless Functions Mysteriously Fail](https://dev.to/pockit_tools/edge-runtime-vs-nodejs-runtime-when-your-serverless-functions-mysteriously-fail-14a)
- [Connection Pooling with Vercel Functions](https://vercel.com/guides/connection-pooling-with-serverless-functions)

### Image Storage
- [Storing Images: Database vs Filesystem – Pros, Cons & Best Practices](https://www.codegenes.net/blog/storing-images-in-a-database-versus-a-filesystem/)
- [AWS S3 Storage Classes: 2026 Cost Optimization Roadmap](https://costimizer.ai/blogs/aws-s3-storage)
- [Cloud Storage Pricing Comparison: AWS S3, GCP, Azure, and B2](https://www.backblaze.com/cloud-storage/pricing)
- [The Cost Structure of Using Nextjs Image](https://indie-starter.dev/blog/the-cost-of-using-nextjs-image)
- [Cutting Vercel Costs by 80%](https://www.howdygo.com/blog/cutting-howdygos-vercel-costs-by-80-without-compromising-ux-or-dx)

### Stripe Payments
- [Stripe Webhooks: Solving Race Conditions and Building a Robust Credit Management System](https://www.pedroalonso.net/blog/stripe-webhooks-solving-race-conditions/)
- [The Race Condition You're Probably Shipping Right Now With Stripe Webhooks](https://dev.to/belazy/the-race-condition-youre-probably-shipping-right-now-with-stripe-webhooks-mj4)
- [Building Reliable Stripe Subscriptions: Webhook Idempotency and Optimistic Locking](https://dev.to/aniefon_umanah_ac5f21311c/building-reliable-stripe-subscriptions-in-nestjs-webhook-idempotency-and-optimistic-locking-3o91)
- [Best practices I wish we knew when integrating Stripe webhooks](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks)
- [Stripe Checkout and Webhook in a Next.js 15 (2025)](https://medium.com/@gragson.john/stripe-checkout-and-webhook-in-a-next-js-15-2025-925d7529855e)
- [Debugging Stripe Webhook Signature Verification Errors in Production](https://dev.to/nerdincode/debugging-stripe-webhook-signature-verification-errors-in-production-1h7c)
- [How to Handle Stripe Webhooks in Next.js (The App Router Way)](https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi)
- [Handle different modes | Stripe Documentation](https://docs.stripe.com/stripe-apps/handling-modes)
- [Go-live checklist | Stripe Documentation](https://docs.stripe.com/get-started/checklist/go-live)

### Rate Limiting
- [How to Implement Rate Limiting in Next.js](https://peerlist.io/blog/engineering/how-to-implement-rate-limiting-in-nextjs)
- [4 Best Rate Limiting Solutions for Next.js Apps](https://dev.to/ethanleetech/4-best-rate-limiting-solutions-for-nextjs-apps-2024-3ljj)
- [The Complete Rate Limiting Handbook](https://saascustomdomains.com/blog/posts/the-complete-rate-limiting-handbook-prevent-abuse-and-optimize-performance)

### Feature Flags
- [Feature flag use cases: progressive or gradual rollouts](https://www.getunleash.io/feature-flag-use-cases-progressive-or-gradual-rollouts)
- [11 principles for building and scaling feature flag systems](https://docs.getunleash.io/guides/feature-flag-best-practices)
- [Feature Flag Best Practices](https://frontegg.com/blog/feature-flag-best-practices)

### Session Migration
- [Automatic Session Linking/Identity Stitching](https://github.com/umami-software/umami/issues/3820) (LOW confidence - GitHub issue only)
