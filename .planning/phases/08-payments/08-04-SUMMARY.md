---
phase: 08-payments
plan: 04
subsystem: payments
tags: [stripe, subscriptions, credits, usage-limits, drizzle]

# Dependency graph
requires:
  - phase: 08-02
    provides: Stripe API routes for checkout and customer management
  - phase: 08-03
    provides: Webhook handlers for subscription and credit events
  - phase: 07
    provides: Daily usage limit system for free tier users
provides:
  - Subscription access helper functions (getUserAccess, hasActiveSubscription)
  - Atomic credit deduction with race condition protection
  - Subscription quota tracking by billing period
  - Generation API with tiered access (unlimited/quota/credits/free)
affects: [09-ui, dashboard, billing-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tiered access pattern: subscription > credits > free"
    - "Atomic credit deduction using SQL WHERE clause checks"
    - "Billing period quota tracking via currentPeriodStart"

key-files:
  created:
    - lib/stripe/subscriptions.ts
  modified:
    - app/api/generate/route.ts

key-decisions:
  - "Priority order: active subscription > credits > free tier"
  - "Subscription quota counts posts from currentPeriodStart to match Stripe billing cycles"
  - "Credit deduction is atomic using SQL gte() check in WHERE clause"
  - "Unlimited plan users bypass all quota checks"
  - "Subscription/credit users bypass Phase 7 daily limit system"

patterns-established:
  - "getUserAccess() centralizes access level determination across all generation flows"
  - "Atomic SQL updates prevent race conditions for credit deduction"
  - "Monthly quota tied to Stripe billing period (not calendar month)"

# Metrics
duration: 2h 3min
completed: 2026-02-01
---

# Phase 08 Plan 04: Generation Integration Summary

**Subscription and credit-based access integrated into generation flow with atomic credit deduction and billing period quota tracking**

## Performance

- **Duration:** 2h 3min
- **Started:** 2026-02-01T15:14:00Z
- **Completed:** 2026-02-01T17:17:05Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Subscription helper functions provide centralized access checking across tiers
- Atomic credit deduction prevents race conditions during concurrent generation requests
- Monthly quota tracking aligned with Stripe billing periods (not calendar months)
- Generation API respects all tier limits: unlimited, quota-based, credit-based, and free

## Task Commits

Each task was committed atomically:

1. **Task 1: Create subscription helper functions** - `f2be9e2` (feat)
2. **Task 2: Update generate API to check subscription/credit access** - `42b8a79` (feat)

## Files Created/Modified

**Created:**
- `lib/stripe/subscriptions.ts` - Access checking and credit management helpers
  - `getUserAccess()`: Determines user tier (subscription/credits/free) with quota info
  - `hasActiveSubscription()`: Quick subscription status check for UI optimization
  - `getSubscriptionQuotaUsed()`: Counts generations in current billing period
  - `deductCredit()`: Atomic credit deduction with race condition protection

**Modified:**
- `app/api/generate/route.ts` - Generation flow with tiered access
  - Unlimited plan: no limits
  - Starter plan: 30 generations/month
  - Pro plan: 70 generations/month
  - Credit users: atomic credit deduction per generation
  - Free users: Phase 7 daily limit (3/day)

## Decisions Made

**ACCESS-01: Tiered access priority order**
- Rationale: Check subscription first (highest value), then credits (purchased), then free tier
- Implementation: `getUserAccess()` returns first matching tier in priority order
- Impact: Prevents credit deduction for subscribed users, ensures correct tier enforcement

**ACCESS-02: Monthly quota based on Stripe billing period**
- Rationale: Align quota reset with subscription billing to match user expectations
- Implementation: Count posts where `createdAt >= subscription.currentPeriodStart`
- Impact: Users get consistent quota regardless of calendar month boundaries

**ACCESS-03: Atomic credit deduction via SQL WHERE clause**
- Rationale: Prevent race conditions when multiple generation requests occur simultaneously
- Implementation: `UPDATE ... WHERE credits >= amount` ensures deduction only if sufficient balance
- Impact: Eliminates potential for negative credit balance, no application-level locks needed

**ACCESS-04: Subscription/credit users bypass daily limit**
- Rationale: Paying users should not be subject to free tier daily restrictions
- Implementation: Only call `checkAndIncrementUsage()` when `access.type === 'free'`
- Impact: Subscribed/credit users never hit daily limit system from Phase 7

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- Phase 09 (UI): Access helpers available for displaying user tier and remaining quota
- Dashboard billing section: Can show subscription status, quota usage, credit balance
- Upgrade flows: Tier detection ready for upgrade prompts

**Notes:**
- Subscription status validation includes both `status = 'active'` AND `currentPeriodEnd > now()` checks
- Credit deduction returns boolean - UI can prompt for credit purchase on `false`
- Free tier users still have Phase 7 daily limits working correctly

---
*Phase: 08-payments*
*Completed: 2026-02-01*
