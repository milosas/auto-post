# Phase 5: Authentication - Research

**Researched:** 2026-01-29
**Domain:** Authentication with Clerk, Next.js 15 App Router, Supabase webhook sync
**Confidence:** HIGH

## Summary

Clerk provides production-ready authentication for Next.js 15 App Router with minimal configuration. The integration requires installing `@clerk/nextjs`, setting up middleware, wrapping the app in `<ClerkProvider>`, and configuring webhooks to sync user data to Supabase. Clerk natively supports Google OAuth, email/password, and magic link (passwordless) authentication out of the box.

Key architectural decisions: All routes are public by default (supporting anonymous users), authentication is enforced only where needed using `clerkMiddleware()` with `createRouteMatcher()`, and user data syncs to Supabase via webhooks using the `user.created`, `user.updated`, and `user.deleted` events. Session management is automatic with hybrid cookie + JWT approach, requiring zero configuration for persistence across page refreshes.

Critical security note: CVE-2025-29927 (disclosed March 2025) requires never relying solely on middleware for authentication. All data access points must verify authentication independently (Data Access Layer pattern).

**Primary recommendation:** Use Clerk's official Next.js SDK with webhook-based Supabase sync. Implement route protection selectively (protect only authenticated routes), verify signatures on webhook endpoints using Svix, and enforce authentication at the data access layer, not just middleware.

## Standard Stack

The established libraries/tools for Clerk authentication in Next.js 15:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@clerk/nextjs` | Latest (Core 2+) | Primary auth SDK for Next.js | Official Clerk SDK with first-class App Router support, updated Jan 14, 2026 |
| Clerk Dashboard | N/A | Configuration UI | Centralized auth settings, OAuth providers, webhook management |
| Svix | Built-in | Webhook security | Industry standard for webhook signing (HMAC-SHA256), used by Clerk |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `drizzle-orm` | ^0.45.1 | Database ORM | Already in stack - use for webhook user sync to Supabase |
| `zod` | ^4.3.6 | Validation | Already in stack - validate webhook payloads and auth data |
| `@upstash/ratelimit` | ^2.0.8 | Rate limiting | Already in stack - apply to auth endpoints (optional, Clerk has built-in limits) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Clerk | NextAuth (Auth.js) | More control but requires manual OAuth setup, session management, and security hardening |
| Clerk | Supabase Auth | Tighter DB integration but less flexible UI customization, no prebuilt components |
| Svix (built-in) | Manual HMAC verification | More work, higher risk of security bugs - use Clerk's `verifyWebhook()` instead |

**Installation:**
```bash
npm install @clerk/nextjs
```

**Required Environment Variables:**
```bash
# From Clerk Dashboard > API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_************************
CLERK_SECRET_KEY=sk_test_************************

# For webhook verification (from Clerk Dashboard > Webhooks)
CLERK_WEBHOOK_SIGNING_SECRET=whsec_************************
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── api/
│   └── webhooks/
│       └── clerk/
│           └── route.ts          # Webhook handler for user sync
├── sign-in/
│   └── [[...sign-in]]/
│       └── page.tsx               # Clerk SignIn component (catch-all route)
├── sign-up/
│   └── [[...sign-up]]/
│       └── page.tsx               # Clerk SignUp component (catch-all route)
├── layout.tsx                     # Wrap in <ClerkProvider>
└── (protected)/                   # Route group for auth-required pages
    ├── dashboard/
    └── settings/

middleware.ts (or proxy.ts)        # clerkMiddleware() at root
.env.local                         # Environment variables
```

### Pattern 1: Middleware Setup (Next.js 15)
**What:** Configure authentication middleware to make routes public by default, protect specific routes on-demand
**When to use:** Always - this is the foundation of Clerk + Next.js integration
**Example:**
```typescript
// middleware.ts (Next.js ≤15) or proxy.ts (Next.js 16+)
// Source: https://clerk.com/docs/reference/nextjs/clerk-middleware
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define protected routes (everything else is public)
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
  '/profile(.*)',
])

// Webhook routes MUST be public for Clerk to access
const isPublicRoute = createRouteMatcher([
  '/api/webhooks(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware((auth, req) => {
  // Always allow webhooks and public routes
  if (isPublicRoute(req)) return

  // Protect designated routes
  if (isProtectedRoute(req)) auth().protect()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

**CRITICAL:** By default, `clerkMiddleware()` does NOT protect any routes - all routes are public. You must explicitly opt-in to protection using `auth().protect()`.

### Pattern 2: ClerkProvider Wrapper
**What:** Wrap root layout with `<ClerkProvider>` to enable client-side auth helpers
**When to use:** Always - required for auth state to work throughout app
**Example:**
```typescript
// app/layout.tsx
// Source: https://clerk.com/docs/nextjs/getting-started/quickstart
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### Pattern 3: Webhook Handler for User Sync
**What:** API route that receives Clerk webhooks and syncs user data to Supabase
**When to use:** Always - required to keep database users table in sync with Clerk
**Example:**
```typescript
// app/api/webhooks/clerk/route.ts
// Source: https://clerk.com/docs/guides/development/webhooks/syncing
import { verifyWebhook } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { db } from '@/app/db'
import { users } from '@/app/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature using Svix
    const evt = await verifyWebhook(req)

    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    const eventType = evt.type

    // Handle user.created event
    if (eventType === 'user.created') {
      await db.insert(users).values({
        clerkId: id,
        email: email_addresses[0].email_address,
        name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        imageUrl: image_url || null,
      })
      console.log(`User created: ${id}`)
    }

    // Handle user.updated event
    if (eventType === 'user.updated') {
      await db.update(users)
        .set({
          email: email_addresses[0].email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
          imageUrl: image_url || null,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, id))
      console.log(`User updated: ${id}`)
    }

    // Handle user.deleted event (soft delete)
    if (eventType === 'user.deleted') {
      await db.update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.clerkId, id))
      console.log(`User deleted: ${id}`)
    }

    // Return 2xx to stop retries
    return new Response('Webhook processed', { status: 200 })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    // Return 4xx to trigger retries
    return new Response('Error verifying webhook', { status: 400 })
  }
}
```

**Security notes:**
- `verifyWebhook()` validates three Svix headers: `svix-id`, `svix-timestamp`, `svix-signature`
- Route MUST be public (excluded from `clerkMiddleware` protection)
- Return 2xx for success, 4xx/5xx triggers exponential backoff retries
- Failed deliveries retry until success - design for idempotency

### Pattern 4: Sign-In/Sign-Up Pages with Catch-All Routes
**What:** Clerk components in optional catch-all routes for flexible auth flows
**When to use:** Always - provides built-in UI for all auth methods (OAuth, email/password, magic link)
**Example:**
```typescript
// app/sign-in/[[...sign-in]]/page.tsx
// Source: https://clerk.com/docs/nextjs/reference/components/authentication/sign-in
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            // Tailwind classes work here
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
          }
        }}
      />
    </div>
  )
}
```

```typescript
// app/sign-up/[[...sign-up]]/page.tsx
// Source: https://clerk.com/docs/nextjs/reference/components/authentication/sign-up
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
          }
        }}
      />
    </div>
  )
}
```

**Customization:** Use the `appearance` prop for Tailwind styling. For deeper control, use Clerk Elements (beta) for fully custom UI with Clerk's auth logic.

### Pattern 5: Checking Auth in Server Components
**What:** Use `auth()` helper in Server Components/Actions to check authentication
**When to use:** Every server-side data access point (CRITICAL for security post-CVE-2025-29927)
**Example:**
```typescript
// app/dashboard/page.tsx
// Source: https://clerk.com/docs/references/nextjs/auth
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/app/db'
import { posts } from '@/app/db/schema'
import { eq } from 'drizzle-orm'

export default async function DashboardPage() {
  const { userId } = await auth()

  // CRITICAL: Verify auth at data access layer, not just middleware
  if (!userId) redirect('/sign-in')

  // Fetch user's posts
  const userPosts = await db.query.posts.findMany({
    where: eq(posts.clerkId, userId),
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  })

  return <div>...</div>
}
```

**Security note:** Never rely solely on middleware for auth verification. CVE-2025-29927 proved middleware can be bypassed. Always verify `userId` at the data access layer.

### Anti-Patterns to Avoid
- **Protecting all routes by default:** Breaks anonymous user access. Keep routes public by default, protect only what needs auth.
- **Relying only on middleware for security:** CVE-2025-29927 vulnerability allows bypass. Always verify auth in Server Components/Actions.
- **Using `auth()` in Client Components:** `auth()` only works server-side. Use `useAuth()` hook for client-side auth checks.
- **Generic error messages:** Decision is to show specific errors ("No account with this email" vs "Invalid credentials"). Implement custom error handling.
- **Forgetting to exclude webhooks from protection:** Webhook routes must be public or Clerk can't reach them.
- **Ignoring webhook retry logic:** Returning 4xx/5xx without fixing issues causes infinite retries. Log errors, fix root cause, return 2xx.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth flow implementation | Custom Google OAuth with state management, PKCE, token exchange | Clerk's Google OAuth (enable in dashboard) | Handles OAuth 2.0 flow, PKCE, token refresh, profile fetching, account linking edge cases |
| Session management | Custom JWT creation, refresh tokens, cookie handling | Clerk's automatic session (hybrid cookie + JWT) | 60-second JWTs with background refresh, multi-tab sync, subdomain support, zero config |
| Password reset flow | Email service + token generation + expiry logic | Clerk's built-in password reset | 10-minute expiring links, same-device verification, automatic email delivery |
| Email verification | Verification code generation + email sending + code validation | Clerk's email verification (enable in dashboard) | Handles code generation, delivery, retry logic, spam prevention |
| Magic link authentication | Secure token generation + email delivery + link validation | Clerk's magic link (enable in dashboard) | Time-limited tokens, device binding, automatic expiry |
| Webhook signature verification | Manual HMAC-SHA256 implementation | Clerk's `verifyWebhook()` with Svix | Validates timestamp freshness, prevents replay attacks, standardized approach |
| User profile UI | Custom forms for name, email, password, 2FA | Clerk's `<UserProfile />` component | Pre-built UI for all profile management, integrates with dashboard settings |
| Multi-factor authentication | TOTP generation, backup codes, SMS delivery | Clerk's MFA (passkeys on paid plan) | Biometric auth, hardware keys, SMS backup, recovery flows |

**Key insight:** Authentication has countless edge cases (account linking, session hijacking prevention, CSRF protection, rate limiting, device tracking). Clerk handles these out of the box. Custom auth implementation takes weeks and introduces security vulnerabilities.

## Common Pitfalls

### Pitfall 1: Missing ClerkProvider or Middleware
**What goes wrong:** `auth() was called but Clerk can't detect usage of clerkMiddleware()` error appears
**Why it happens:** Either `<ClerkProvider>` is missing from layout, or `clerkMiddleware()` matcher excludes the route, or middleware file isn't named correctly (should be `middleware.ts` for Next.js ≤15)
**How to avoid:**
- Always wrap root layout in `<ClerkProvider>`
- Ensure `middleware.ts` (or `proxy.ts` for Next.js 16+) exists at project root
- Use the default matcher from Clerk docs (handles static assets correctly)
**Warning signs:** Auth hooks return null, `userId` is always undefined, components can't access Clerk context

**Source:** [Clerk Error Reference](https://clerk.com/docs/reference/nextjs/errors/auth-was-called)

### Pitfall 2: Protecting Routes Without Understanding Defaults
**What goes wrong:** Anonymous users can't access the app, or protected routes are accidentally public
**Why it happens:** Assumption that `clerkMiddleware()` protects routes by default (it doesn't), or incorrect use of `createRouteMatcher()` logic
**How to avoid:**
- Remember: **all routes are public by default** with `clerkMiddleware()`
- Explicitly protect routes with `auth().protect()` inside middleware
- Test both authenticated and unauthenticated flows during development
**Warning signs:** Users hitting 401 errors on public pages, or accessing protected pages without logging in

**Source:** [clerkMiddleware Documentation](https://clerk.com/docs/reference/nextjs/clerk-middleware)

### Pitfall 3: CVE-2025-29927 - Middleware-Only Auth Verification
**What goes wrong:** Attackers bypass middleware checks using `x-middleware-subrequest` header manipulation, accessing protected data
**Why it happens:** Relying solely on middleware for authentication without verifying at data access layer
**How to avoid:**
- **ALWAYS** verify `auth()` in Server Components, Route Handlers, and Server Actions
- Upgrade to patched Next.js versions: 15.2.3+, 14.2.25+, 13.5.9+, or 12.3.5+
- Implement Data Access Layer pattern: check `userId` before every database query
**Warning signs:** Using middleware `auth().protect()` but not checking `auth()` in components/actions

**Source:** [Next.js Security Checklist](https://blog.arcjet.com/next-js-security-checklist/) and [Complete Authentication Guide for Next.js App Router](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)

### Pitfall 4: Webhook Route Not Public
**What goes wrong:** Clerk webhook deliveries fail with 401/403 errors, users aren't synced to database
**Why it happens:** Webhook route `/api/webhooks/clerk` is protected by `clerkMiddleware()`, blocking Clerk's servers
**How to avoid:**
- Use `createRouteMatcher(['/api/webhooks(.*)'])` to mark webhooks as public
- Test webhook delivery using Clerk Dashboard's "Send test event" before deploying
- Monitor webhook delivery logs in Clerk Dashboard for 4xx/5xx errors
**Warning signs:** New users appear in Clerk Dashboard but not in database, webhook delivery shows "Failed" status

**Source:** [Sync Clerk data with webhooks](https://clerk.com/docs/guides/development/webhooks/syncing)

### Pitfall 5: Google OAuth Not "In Production" Status
**What goes wrong:** Google OAuth works in development but shows scary "unverified app" warning in production
**Why it happens:** Google Cloud Console OAuth app is still in "Testing" mode, requires verification for production
**How to avoid:**
- Switch OAuth app to "In production" status in Google Cloud Console
- Complete Google's app verification (name, logo, scopes review)
- Use Clerk's shared credentials in development, custom credentials in production
**Warning signs:** Users see "This app hasn't been verified" warning during Google sign-in

**Source:** [Clerk Google OAuth Setup](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google)

### Pitfall 6: Webhook Idempotency Not Handled
**What goes wrong:** Duplicate user records or database conflicts when Clerk retries webhook delivery
**Why it happens:** Webhook handler doesn't check for existing records before inserting, Clerk retries on 4xx/5xx responses
**How to avoid:**
- Use upsert logic: insert if not exists, update if exists
- Check for `clerkId` uniqueness before insert (already in schema as unique index)
- Return 200 even if record already exists (idempotent operation)
- Track `svix-id` header to detect duplicate deliveries (optional but recommended)
**Warning signs:** Duplicate key errors in webhook handler logs, inconsistent user data

**Source:** [Clerk Webhooks Best Practices](https://clerk.com/blog/webhooks-getting-started)

### Pitfall 7: Next.js 15 Rate Limit Issues
**What goes wrong:** Hitting Clerk's rate limits (1000 requests per 10 seconds) in production
**Why it happens:** Next.js 15 changed fetch caching behavior, causing excessive API calls to Clerk
**How to avoid:**
- Update to latest `@clerk/nextjs` version (includes Next.js 15 fixes)
- Monitor rate limit usage in Clerk Dashboard
- Implement request caching for frequently accessed auth data
- Consider upgrading Clerk plan if consistently hitting limits
**Warning signs:** 429 errors in production logs, intermittent auth failures

**Source:** [Clerk/JavaScript Issue #4894](https://github.com/clerk/javascript/issues/4894)

### Pitfall 8: Link Prefetching on Protected Routes
**What goes wrong:** Next.js `<Link>` prefetch fails with 401 error in console when pointing to protected routes from public pages
**Why it happens:** Next.js prefetches protected route data while user is unauthenticated, gets redirected to sign-in
**How to avoid:**
- Add `prefetch={false}` to `<Link>` components pointing to protected routes
- Or accept the console warning (doesn't affect functionality)
**Warning signs:** Console errors about failed prefetch requests, doesn't break app but looks unprofessional

**Source:** [clerkMiddleware Documentation](https://clerk.com/docs/reference/nextjs/clerk-middleware)

## Code Examples

Verified patterns from official sources:

### Enabling Google OAuth, Email/Password, and Magic Link
```typescript
// Configuration via Clerk Dashboard, not code
// Source: https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options

// Navigate to: Dashboard > User & Authentication > Email, Phone, Username
// 1. Enable "Email address" as identifier
// 2. Enable "Password" authentication strategy
// 3. Enable "Email verification link" for magic links
// 4. Enable "Email verification code" for OTP (optional)

// Navigate to: Dashboard > SSO Connections
// 1. Click "Add connection"
// 2. Select "For all users"
// 3. Choose "Google" from provider dropdown
// 4. For development: Click "Add connection" (uses Clerk's shared credentials)
// 5. For production: Add Client ID and Client Secret from Google Cloud Console

// All auth methods now appear automatically in <SignIn /> and <SignUp /> components
```

**Important:** Magic links in Clerk are time-limited (10-minute expiry) and device-bound by default for security.

### Reading User Data in Server Components
```typescript
// app/api/user-profile/route.ts
// Source: https://clerk.com/docs/references/nextjs/read-session-data
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  // Option 1: Get just userId and sessionId (fast)
  const { userId, sessionId } = await auth()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Option 2: Get full user object (requires API call to Clerk)
  const user = await currentUser()

  return Response.json({
    id: user.id,
    email: user.emailAddresses[0].emailAddress,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    imageUrl: user.imageUrl,
  })
}
```

**Performance note:** `auth()` is faster than `currentUser()` - use `auth()` when you only need `userId`.

### Checking Auth in Client Components
```typescript
// app/components/UserButton.tsx
// Source: https://clerk.com/docs/nextjs/guides/users/reading
'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { UserButton as ClerkUserButton } from '@clerk/nextjs'

export function UserButton() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
  }

  if (!isSignedIn) {
    return <a href="/sign-in">Sign In</a>
  }

  // Clerk's built-in user button with dropdown
  return <ClerkUserButton afterSignOutUrl="/" />
}
```

**Note:** `useAuth()` and `useUser()` only work in Client Components. Use `auth()` in Server Components.

### Customizing Clerk Components with Tailwind
```typescript
// app/sign-in/[[...sign-in]]/page.tsx
// Source: https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/overview
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
          card: 'shadow-lg',
          headerTitle: 'text-2xl font-bold',
          headerSubtitle: 'text-gray-600',
          socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
          formFieldLabel: 'text-sm font-medium text-gray-700',
          formFieldInput: 'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          footerActionLink: 'text-blue-600 hover:text-blue-700',
        },
      }}
    />
  )
}
```

**Advanced:** For full control, use Clerk Elements (beta) to build custom forms while Clerk handles auth logic.

### Protecting API Routes
```typescript
// app/api/posts/route.ts
// Source: https://clerk.com/docs/references/nextjs/auth
import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { db } from '@/app/db'
import { posts } from '@/app/db/schema'

export async function POST(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()

  // Create post for authenticated user
  const newPost = await db.insert(posts).values({
    userId, // Use Clerk userId
    text: body.text,
    imageUrl: body.imageUrl,
    config: body.config,
  }).returning()

  return Response.json(newPost[0])
}
```

### Password Reset Flow (Using Clerk's Built-In)
```typescript
// No custom code needed - Clerk handles this automatically
// Source: https://clerk.com/docs/guides/development/custom-flows/account-updates/forgot-password

// When user clicks "Forgot password?" on <SignIn /> component:
// 1. Clerk shows email input
// 2. Clerk sends reset link (expires in 10 minutes)
// 3. User clicks link, enters new password
// 4. Clerk updates password and signs user in
// 5. user.updated webhook fires (sync to database)

// To customize UI, use Clerk Elements or build custom flow with Clerk SDK
```

**Configuration:** Enable password reset in Clerk Dashboard > Email & SMS > Email settings.

### Session Persistence Configuration
```typescript
// No configuration needed - Clerk handles this automatically
// Source: https://clerk.com/blog/complete-guide-session-management-nextjs

// How it works:
// - Clerk sets long-lived cookie on Clerk's Frontend API domain
// - Short-lived JWTs (60-second default) stored in client
// - Background refresh keeps session active
// - Sessions persist across tabs, subdomains, page refreshes
// - Zero configuration required

// To customize session duration, go to:
// Clerk Dashboard > Sessions > Session lifetime
// Options: 7 days (default), 30 days, 90 days, or custom
```

**Note:** Session tasks (like email verification) can gate features. Check `auth().sessionClaims` for pending tasks.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NextAuth v4 | Clerk or Auth.js (NextAuth v5) | 2024-2025 | Clerk offers faster setup, better DX; Auth.js offers more control |
| `authMiddleware()` | `clerkMiddleware()` | Clerk Core 2 (2024) | New API, better performance, Next.js 15 compatibility |
| JWT template for Supabase | Native Supabase integration | April 1, 2025 | Clerk deprecated JWT template, webhooks are now standard approach |
| Manual OAuth setup | Clerk's OAuth connections | Always | Clerk abstracts OAuth complexity, dev credentials in testing mode |
| Middleware-only auth | Data Access Layer verification | CVE-2025-29927 (March 2025) | Security critical - always verify auth at data access points |
| File naming: `middleware.ts` | `proxy.ts` (Next.js 16+) | Next.js 16 | Backward compatible - `middleware.ts` still works in Next.js ≤15 |

**Deprecated/outdated:**
- **Clerk JWT template for Supabase:** Deprecated April 1, 2025 - use webhooks instead for syncing user data
- **`authMiddleware()` from @clerk/nextjs:** Replaced by `clerkMiddleware()` in Core 2 - update to new API
- **CLERK_API_KEY environment variable:** Renamed to `CLERK_SECRET_KEY` - update in `.env` files
- **Relying solely on middleware for auth:** Post-CVE-2025-29927, must verify at data access layer

## Open Questions

Things that couldn't be fully resolved:

1. **Rate limiting strategy for auth endpoints**
   - What we know: Clerk has built-in rate limits (1000 requests per 10 seconds), Next.js 15 can trigger excessive requests
   - What's unclear: Whether additional rate limiting (e.g., with `@upstash/ratelimit`) is needed for webhook endpoints
   - Recommendation: Start without additional rate limiting, monitor Clerk Dashboard metrics, add custom rate limiting if hitting Clerk's limits or seeing abuse

2. **Email verification gate timing**
   - What we know: Decision is to gate at payment, not signup. Clerk supports email verification as optional or required.
   - What's unclear: How to enforce "email must be verified before payment" without enforcing at signup
   - Recommendation: Keep email verification optional in Clerk Dashboard, check `user.emailAddresses[0].verification.status === 'verified'` in payment flow, redirect to verification page if unverified

3. **Session duration recommendation**
   - What we know: Clerk defaults to 7 days, supports up to 90 days or custom
   - What's unclear: Optimal duration for this app (balance security vs. convenience)
   - Recommendation: Start with 7-day default, gather user feedback on re-login frequency, increase to 30 days if users complain

4. **Webhook delivery monitoring in production**
   - What we know: Clerk Dashboard shows delivery status, retries use exponential backoff
   - What's unclear: Whether to implement additional monitoring (e.g., logging webhook events to separate table)
   - Recommendation: Start with Clerk Dashboard monitoring, add database logging if troubleshooting sync issues, consider alerting for sustained failures

## Sources

### Primary (HIGH confidence)
- [Clerk Next.js Quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart) - Installation, middleware setup (verified Jan 14, 2026)
- [clerkMiddleware() Reference](https://clerk.com/docs/reference/nextjs/clerk-middleware) - Route protection, configuration options
- [Clerk Webhooks Syncing](https://clerk.com/docs/guides/development/webhooks/syncing) - Webhook handlers, `verifyWebhook()` usage
- [Clerk Supabase Integration](https://clerk.com/docs/guides/development/integrations/databases/supabase) - Database sync guidance
- [Clerk Authentication Strategies](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options) - OAuth, email/password, magic link config
- [Clerk Google OAuth Setup](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google) - Production OAuth credentials
- [Clerk Appearance Customization](https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/overview) - Tailwind styling
- [Clerk Webhooks Getting Started](https://clerk.com/blog/webhooks-getting-started) - Svix security, retry logic, best practices

### Secondary (MEDIUM confidence)
- [Complete Authentication Guide for Next.js App Router 2025](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router) - CVE-2025-29927 context, security best practices
- [Next.js Security Checklist](https://blog.arcjet.com/next-js-security-checklist/) - CVE-2025-29927 vulnerability details, Data Access Layer pattern
- [Next.js Session Management Guide](https://clerk.com/articles/nextjs-session-management-solving-nextauth-persistence-issues) - Session persistence architecture
- [Build with Matija: Clerk + Next.js 15](https://www.buildwithmatija.com/blog/clerk-authentication-nextjs15-app-router) - Full integration tutorial (Jan 2026)
- [Clerk/JavaScript Issue #4894](https://github.com/clerk/javascript/issues/4894) - Next.js 15 rate limiting issue

### Tertiary (LOW confidence)
- Medium articles on Clerk + Supabase sync - Practical examples but not official documentation, verify patterns with primary sources
- DEV.to tutorials on webhook handlers - Useful code patterns but check against official Clerk docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Clerk is explicitly decided, official docs current as of Jan 2026, proven Next.js 15 compatibility
- Architecture: HIGH - All patterns from official Clerk documentation, webhook approach verified in Supabase integration guide
- Pitfalls: HIGH - CVE-2025-29927 officially documented, other issues from Clerk error reference and GitHub issues
- Code examples: HIGH - All from official Clerk docs or verified Next.js 15 tutorials

**Research date:** 2026-01-29
**Valid until:** 2026-02-28 (30 days - stable auth provider, slow-moving domain)

**Notes:**
- Clerk documentation last updated Jan 14, 2026 - extremely current
- Next.js 15 compatibility confirmed in official quickstart
- CVE-2025-29927 requires immediate attention - already patched in Next.js 15.2.3+
- All requirements from CONTEXT.md can be met with Clerk's built-in features (no custom auth flows needed)
