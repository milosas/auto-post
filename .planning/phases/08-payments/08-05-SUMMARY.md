---
phase: 08-payments
plan: 05
subsystem: payments
tags: [stripe, pricing, subscriptions, credits, ui]

# Dependency graph
requires:
  - phase: 08-04
    provides: Subscription helpers and generate API integration
  - phase: 08-02
    provides: Stripe API routes for checkout and credits
provides:
  - Public pricing page with subscription tiers and credit packages
  - Subscription status API endpoint for UI components
  - Dashboard widget showing subscription/credit status
affects: [09-dashboard, main-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Billing interval toggle state (monthly/annual)"
    - "Client-side auth check before checkout redirect"
    - "Progress bar for quota visualization"

key-files:
  created:
    - app/pricing/page.tsx
    - app/api/subscription/status/route.ts
    - app/components/SubscriptionStatus.tsx
  modified:
    - app/components/UpgradeCTA.tsx

key-decisions:
  - "NEXT_PUBLIC_ env vars for client-side price IDs (allows dynamic pricing display)"
  - "Annual pricing shows '2 mėnesiai nemokamai' badge for conversion optimization"
  - "Pro plan highlighted as 'Populiariausias' (most popular) for social proof"
  - "Credit packages show per-credit price to highlight bulk discounts"

patterns-established:
  - "Pricing page pattern: interval toggle + plan cards + checkout redirect"
  - "Subscription status widget: fetch on mount + conditional rendering by tier"
  - "Portal redirect pattern: POST to /api/stripe/portal -> redirect to Stripe"

# Metrics
duration: ~30min
completed: 2026-02-01
---

# Phase 08 Plan 05: Pricing Page & Billing UI Summary

**Pricing page and subscription status components for complete billing user experience**

## Performance

- **Duration:** ~30min
- **Completed:** 2026-02-01
- **Tasks:** 3
- **Files created:** 3
- **Files modified:** 1

## Accomplishments

- Public pricing page at `/pricing` with three subscription tiers (Starter, Pro, Unlimited)
- Monthly/annual billing toggle with "2 months free" incentive for annual plans
- Credit packages section (10, 30, 100 credits) with per-credit pricing
- Subscription status API endpoint returning UserAccess type
- Dashboard widget showing current plan, quota usage, and renewal date
- Customer Portal integration for subscription management

## Task Commits

Each task was committed atomically:

1. **Task 1: Create pricing page** - `75c780f` (feat)
2. **Task 2a: Create subscription status API** - `68d92a9` (feat)
3. **Task 2b: Create subscription status component** - `43f01a0` (feat)

## Files Created/Modified

**Created:**
- `app/pricing/page.tsx` - Full pricing page with:
  - Billing interval toggle (monthly/annual)
  - Three subscription plan cards with features
  - Credit packages section
  - Checkout flow via `/api/stripe/checkout`
  - Credits purchase via `/api/stripe/credits`

- `app/api/subscription/status/route.ts` - API endpoint:
  - GET returns UserAccess object
  - Includes subscription quota used count
  - Returns 401 for unauthenticated requests

- `app/components/SubscriptionStatus.tsx` - Dashboard widget:
  - Shows plan name (Starter/Pro/Unlimited/Nemokamas)
  - Progress bar for quota usage (X/30 or X/70)
  - "Neribota generacijų" for Unlimited plan
  - Credit balance display for credit users
  - "Valdyti prenumeratą" button → Stripe Customer Portal
  - "Pirkti daugiau kreditų" link for credit users

**Modified:**
- `app/components/UpgradeCTA.tsx` - Already had subscription management logic from earlier work

## Decisions Made

**UI-PRICING-01: Client-side price IDs**
- Rationale: Pricing page is client component, needs access to Stripe price IDs
- Implementation: NEXT_PUBLIC_STRIPE_PRICE_* environment variables
- Impact: Allows dynamic pricing display without server round-trip

**UI-PRICING-02: Annual discount badge**
- Rationale: Encourage annual subscriptions for better retention
- Implementation: "2 mėnesiai nemokamai" badge on annual toggle
- Impact: Clear value proposition for annual plans

**UI-PRICING-03: Pro plan social proof**
- Rationale: Guide users toward mid-tier plan
- Implementation: "Populiariausias" badge + ring-2 border highlight
- Impact: Visual differentiation drives conversion to Pro tier

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None.

## User Setup Required

**Environment Variables (client-side):**
```env
NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_ANNUAL=price_xxx
```

These are public keys (just IDs), safe for client-side exposure.

## Phase 8 Complete

With this plan complete, Phase 8 (Payments) is fully implemented:
- ✅ 08-01: Stripe SDK setup and webhook schema
- ✅ 08-02: Stripe API routes (checkout, portal, credits)
- ✅ 08-03: Webhook handler with idempotency
- ✅ 08-04: Subscription helpers and generate API integration
- ✅ 08-05: Pricing page and billing UI components

**Ready for Phase 9: Dashboard & Polish**

---
*Phase: 08-payments*
*Completed: 2026-02-01*
