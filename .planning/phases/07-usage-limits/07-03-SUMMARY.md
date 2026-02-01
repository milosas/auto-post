---
phase: 07-usage-limits
plan: 03
subsystem: api
tags: [supabase, drizzle, quota-enforcement, usage-limits, upgrade-cta]

# Dependency graph
requires:
  - phase: 07-01
    provides: checkAndIncrementUsage function and timezone utilities
provides:
  - UpgradeCTA component for upgrade prompts
  - /api/generate with quota enforcement
  - 401/429 error responses with upgrade messaging
affects: [07-04, frontend-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Node.js runtime for API routes needing Drizzle ORM"
    - "X-Timezone header pattern for user timezone detection"
    - "Authentication required before quota checks"

key-files:
  created:
    - app/components/UpgradeCTA.tsx
  modified:
    - app/api/generate/route.ts

key-decisions:
  - "RUNTIME-01: Switch /api/generate from Edge to Node.js runtime (Drizzle requires Node.js, streaming still works)"
  - "AUTH-06: Authentication required before generation (prevents anonymous usage)"
  - "UX-01: Upgrade CTA with gradient button and benefits tooltip"

patterns-established:
  - "Auth check → quota check → business logic flow for protected endpoints"
  - "429 responses include resetAt timestamp for countdown timers"
  - "Placeholder click handlers for future features (Stripe in Phase 8)"

# Metrics
duration: 3min
completed: 2026-02-01
---

# Phase 07 Plan 03: Upgrade CTA and Quota Enforcement Summary

**Node.js /api/generate with authentication + quota enforcement, UpgradeCTA component with €9/month pricing and benefits tooltip**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-01T05:07:17Z
- **Completed:** 2026-02-01T05:10:27Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- UpgradeCTA component created with gradient button, €9/month price, and hover benefits tooltip
- /api/generate enforces authentication (401 for unauthenticated users)
- /api/generate enforces quota limits (429 for exceeded quota with upgrade message)
- Runtime switched from Edge to Node.js for direct Drizzle ORM access
- Quota incremented before generation starts (fail-fast pattern)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create UpgradeCTA component** - `ed06373` (feat)
   - Gradient purple/pink button with €9/month price
   - Hover tooltip showing benefits (unlimited generations, priority support, unlimited history)
   - Lithuanian translations for all text
   - Placeholder click handler for Phase 8 Stripe integration

2. **Task 2: Add quota check to /api/generate** - `678b28b` (feat)
   - Switch from Edge to Node.js runtime (60s timeout)
   - Add authentication check (401 for unauthenticated)
   - Add quota enforcement via checkAndIncrementUsage
   - Return 429 with upgrade message when quota exceeded
   - Get timezone from X-Timezone header

## Files Created/Modified

- `app/components/UpgradeCTA.tsx` - Upgrade call-to-action button with price and benefits tooltip
- `app/api/generate/route.ts` - Updated generate endpoint with authentication and quota enforcement

## Decisions Made

**RUNTIME-01: Switch /api/generate from Edge to Node.js runtime**
- **Reason:** Edge-to-Node internal fetch loses Supabase session context (cookies don't forward properly between runtimes). Drizzle ORM works directly in Node.js without needing internal API calls.
- **Trade-off:** 60s timeout instead of 25s Edge timeout (rarely hit in practice, typical generation is 5-15s)
- **Benefit:** Simpler architecture, easier to debug, streaming still works in Node.js

**AUTH-06: Authentication required before generation**
- **Reason:** Enforce usage limits and prevent anonymous abuse
- **Implementation:** 401 response with sign-in prompt for unauthenticated requests
- **Impact:** All future generation requests require authentication

**UX-01: Upgrade CTA with gradient button and benefits tooltip**
- **Reason:** Clear visual differentiation from regular buttons, benefits visible on hover
- **Price:** €9/month (matches Phase 7 research)
- **Benefits:** Unlimited generations, priority support, unlimited post history

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

Ready for Phase 07-04 (Frontend Quota Display):
- UpgradeCTA component available for import
- /api/generate returns quota data in 429 responses (used, limit, resetAt)
- Authentication and quota enforcement fully operational

**Integration points for 07-04:**
- Import UpgradeCTA in quota display UI
- Parse 429 response to show usage status
- Use resetAt timestamp for countdown timer

---
*Phase: 07-usage-limits*
*Completed: 2026-02-01*
