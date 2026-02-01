---
phase: 08-payments
plan: 02
subsystem: api
tags: [stripe, checkout, payments, api, subscriptions, credits]

# Dependency graph
requires:
  - phase: 08-01
    provides: Stripe client initialization, pricing config, database schema
provides:
  - API route for subscription checkout
  - API route for customer portal access
  - API route for credit package purchases
  - User-to-customer creation logic with metadata
affects: [08-03, 08-04, pricing-ui, subscription-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [checkout-session-creation, customer-lookup-or-create, metadata-correlation]

key-files:
  created:
    - app/api/stripe/checkout/route.ts
    - app/api/stripe/portal/route.ts
    - app/api/stripe/credits/route.ts
  modified: []

key-decisions:
  - "API-CHECKOUT-01: Get or create Stripe customer pattern - check subscriptions table for stripeCustomerId first, create new customer if missing"
  - "API-CHECKOUT-02: Metadata correlation - all checkout sessions include userId and relevant IDs for webhook handling"
  - "API-CHECKOUT-03: mode: 'subscription' for recurring plans, mode: 'payment' for one-time credit purchases"

patterns-established:
  - "Checkout Session pattern: authenticate → get internal user → get/create customer → create session with metadata → return URL"
  - "Customer Portal pattern: authenticate → lookup stripeCustomerId → return 404 if none → create portal session → return URL"

# Metrics
duration: 3min
completed: 2026-02-01
---

# Phase 8 Plan 2: Stripe API Routes Summary

**Subscription checkout, customer portal access, and credit package purchase API routes with user-to-customer correlation via metadata**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-01T15:07:01Z
- **Completed:** 2026-02-01T15:09:36Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- Subscription checkout route creates Stripe Checkout Sessions for recurring subscriptions
- Customer portal route enables subscribed users to manage their subscriptions via Stripe
- Credit package route creates one-time payment Checkout Sessions for credit purchases
- All routes implement get-or-create customer pattern for seamless user-to-Stripe mapping

## Task Commits

Each task was committed atomically:

1. **Task 1: Create subscription Checkout Session API route** - `bfef53d` (feat)
2. **Task 2: Create Customer Portal API route** - `1d66d7a` (feat)
3. **Task 3: Create credit package purchase API route** - `0ab067c` (feat)

## Files Created/Modified
- `app/api/stripe/checkout/route.ts` - POST route for subscription checkout, creates Checkout Session with subscription mode
- `app/api/stripe/portal/route.ts` - POST route for customer portal, requires existing stripeCustomerId
- `app/api/stripe/credits/route.ts` - POST route for credit purchases, creates Checkout Session with payment mode

## Decisions Made

**API-CHECKOUT-01: Get or create Stripe customer pattern**
- Check subscriptions table for existing stripeCustomerId first
- Reuse customer if found, create new customer if missing
- Store userId in Stripe customer metadata for correlation
- Rationale: Avoids duplicate customers, enables future customer lookups by userId

**API-CHECKOUT-02: Metadata correlation**
- All checkout sessions include userId in metadata
- Subscription sessions include priceId for plan identification
- Credit sessions include credits amount and type: 'credit_purchase'
- Rationale: Webhook handlers need this data to update database correctly

**API-CHECKOUT-03: Payment modes**
- mode: 'subscription' for recurring subscription plans
- mode: 'payment' for one-time credit package purchases
- Rationale: Different Stripe behaviors - subscriptions recur, payments are one-time

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All routes compiled successfully. Pre-existing TypeScript error in webhooks route (missing handlers file) is expected and will be resolved in future plan.

## User Setup Required

None - no additional configuration required. Routes use existing environment variables:
- NEXT_PUBLIC_SITE_URL (for success/cancel URLs)
- Stripe price IDs (configured in plan 08-01)

## Next Phase Readiness

**Ready for webhook implementation (08-03):**
- All checkout sessions include necessary metadata for webhook correlation
- Customer creation stores userId for lookup
- type: 'credit_purchase' metadata enables webhook handler to distinguish credit purchases from subscriptions

**Blockers/concerns:**
- Customer Portal must be configured in Stripe Dashboard before /api/stripe/portal will work (Settings → Billing → Customer Portal → Activate)
- Webhook secret needed for plan 08-03 (create webhook endpoint in Stripe Dashboard)

---
*Phase: 08-payments*
*Plan: 02*
*Completed: 2026-02-01*
