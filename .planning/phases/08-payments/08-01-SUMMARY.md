---
phase: 08-payments
plan: 01
subsystem: payments
tags: [stripe, payments, webhooks, idempotency]

# Dependency graph
requires:
  - phase: 04-database
    provides: "Database schema foundation with Drizzle ORM"
provides:
  - "Stripe SDK v20.3.0 singleton client"
  - "Price configuration for all subscription tiers and credit packages"
  - "webhook_events table for Stripe idempotency tracking"
affects: [08-02, 08-03, 08-04, 08-05]

# Tech tracking
tech-stack:
  added: [stripe@20.3.0, @stripe/stripe-js@8.7.0, pg@8.13.1]
  patterns: ["Environment-based price ID configuration", "Webhook idempotency via unique event tracking"]

key-files:
  created:
    - lib/stripe/client.ts
    - lib/stripe/config.ts
  modified:
    - app/db/schema.ts

key-decisions:
  - "STRIPE-01: API version 2026-01-28.clover (latest supported by SDK)"
  - "STRIPE-02: Price IDs from environment variables for flexibility across environments"
  - "STRIPE-03: Installed pg driver for direct SQL execution (drizzle-kit push had constraint parsing bug)"

patterns-established:
  - "Stripe singleton: lib/stripe/client.ts exports configured instance"
  - "Price config helpers: getPlanByPriceId and getCreditPackageByPriceId for webhook handlers"
  - "Webhook idempotency: stripeEventId unique constraint prevents duplicate processing"

# Metrics
duration: 7min
completed: 2026-02-01
---

# Phase 08 Plan 01: Stripe Foundation Summary

**Stripe SDK v20.3.0 integrated with environment-based price configuration and webhook idempotency table**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-01T08:02:46Z
- **Completed:** 2026-02-01T08:09:23Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Stripe SDK installed and configured with singleton pattern
- All subscription tiers and credit packages defined (Starter €9, Pro €19, Unlimited €49)
- webhook_events table created for preventing duplicate Stripe event processing
- Schema bug fixed (clerkId → authId from Phase 5 Supabase migration)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Stripe dependencies and create client singleton** - `23cd996` (chore)
   - Installed stripe@20.3.0 and @stripe/stripe-js@8.7.0
   - Created lib/stripe/client.ts with Stripe instance
   - Using API version 2026-01-28.clover

2. **Task 2: Create Stripe pricing configuration** - `2398f6d` (feat)
   - Defined all subscription tiers (Starter, Pro, Unlimited)
   - Defined credit packages (10, 30, 100 credits)
   - Helper functions getPlanByPriceId and getCreditPackageByPriceId

3. **Task 3: Add webhook_events table** - `718e245` (feat)
   - Created webhook_events table with stripe_event_id unique constraint
   - Added indexes for efficient event lookup
   - Fixed schema.ts: clerkId → authId (Supabase Auth migration fix)

## Files Created/Modified
- `lib/stripe/client.ts` - Stripe SDK singleton with environment variable validation
- `lib/stripe/config.ts` - Price IDs and plan configuration with lookup helpers
- `app/db/schema.ts` - Added webhookEvents table, fixed users table authId field
- `package.json` - Added stripe, @stripe/stripe-js, pg dependencies

## Decisions Made

**STRIPE-01: API version 2026-01-28.clover**
- Plan specified 2024-12-18.acacia, but stripe@20.3.0 SDK expects 2026-01-28.clover
- Used latest API version supported by installed SDK version

**STRIPE-02: Price IDs from environment variables**
- Allows same codebase to work across dev/staging/prod with different Stripe products
- Pattern: `process.env.STRIPE_PRICE_STARTER_MONTHLY!` for each tier/interval

**STRIPE-03: Direct SQL execution for schema changes**
- drizzle-kit push failed with constraint parsing error
- Installed pg driver and executed CREATE TABLE statements directly
- webhook_events table successfully created with proper indexes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed schema.ts clerkId → authId mismatch**
- **Found during:** Task 3 (TypeScript compilation check)
- **Issue:** schema.ts still had `clerkId` from old Clerk implementation, but code uses `authId` from Supabase Auth (Phase 5). This caused 15+ TypeScript compilation errors across API routes, auth helpers, and UI pages.
- **Fix:** Updated users table schema to use `authId: text('auth_id')` and changed index from `users_clerk_id_unique` to `users_auth_id_unique`
- **Files modified:** app/db/schema.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 718e245 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Critical bug fix - schema must match code for compilation. This was leftover from Phase 5 Supabase migration that wasn't caught earlier. No scope creep.

## Issues Encountered

**drizzle-kit push constraint parsing error**
- Problem: Running `npx drizzle-kit push` failed with "Cannot read properties of undefined (reading 'replace')" error during schema introspection
- Root cause: Bug in drizzle-kit with parsing existing database constraints
- Solution: Created SQL file manually and executed via pg driver
- Impact: 2 min delay, but table created successfully with all constraints and indexes

## User Setup Required

**Stripe integration requires manual dashboard configuration.**

**Environment variables needed (.env.local):**
```bash
STRIPE_SECRET_KEY="sk_test_..."                    # Stripe Dashboard → Developers → API keys
STRIPE_PUBLISHABLE_KEY="pk_test_..."               # Same location
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."   # Client-side accessible
STRIPE_WEBHOOK_SECRET="whsec_..."                  # After webhook endpoint created

# Price IDs (create products in Stripe Dashboard first)
STRIPE_PRICE_STARTER_MONTHLY="price_..."
STRIPE_PRICE_STARTER_ANNUAL="price_..."
STRIPE_PRICE_PRO_MONTHLY="price_..."
STRIPE_PRICE_PRO_ANNUAL="price_..."
STRIPE_PRICE_UNLIMITED_MONTHLY="price_..."
STRIPE_PRICE_UNLIMITED_ANNUAL="price_..."
STRIPE_PRICE_CREDITS_10="price_..."
STRIPE_PRICE_CREDITS_30="price_..."
STRIPE_PRICE_CREDITS_100="price_..."
```

**Stripe Dashboard configuration:**
1. **Create Products** (Stripe Dashboard → Products → Add product)
   - Starter: €9/month, €90/year (30 posts/month quota)
   - Pro: €19/month, €190/year (70 posts/month quota)
   - Unlimited: €49/month, €490/year (unlimited posts)
   - Credits: 10 for €5, 30 for €12, 100 for €35

2. **Copy Price IDs** from each product/price to environment variables

3. **Configure Customer Portal** (Settings → Customer Portal)
   - Enable portal link
   - Allow subscription cancellation and plan updates

## Next Phase Readiness

**Ready for Phase 08-02 (Subscription Management):**
- Stripe client configured and available via singleton
- Price configuration helpers ready for webhook handlers
- webhook_events table ready for idempotency tracking
- All subscription and credit package pricing defined

**No blockers.** Stripe foundation is complete and TypeScript compiles cleanly.

**Note for next plans:** User setup required before testing. Stripe Dashboard products must be created and price IDs added to environment before subscription flows can be tested.

---
*Phase: 08-payments*
*Completed: 2026-02-01*
