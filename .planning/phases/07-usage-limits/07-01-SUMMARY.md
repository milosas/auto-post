---
phase: 07-usage-limits
plan: 01
subsystem: api
tags: [usage-limits, timezone, drizzle, supabase, date-fns, postgres]

# Dependency graph
requires:
  - phase: 04-database-foundation
    provides: usageLimits table schema and Drizzle setup
  - phase: 05-authentication
    provides: Supabase auth integration for user verification
provides:
  - Usage tracking backend with timezone-aware reset logic
  - Atomic increment operations with race condition protection
  - GET /api/usage endpoint for checking current quota
  - POST /api/usage endpoint for incrementing usage
affects: [07-02-usage-ui, 07-03-usage-integration, pricing, subscriptions]

# Tech tracking
tech-stack:
  added: [@date-fns/tz]
  patterns: [timezone-aware reset, atomic SQL increment with WHERE constraint, internal user ID lookup]

key-files:
  created:
    - lib/usage/timezone.ts
    - lib/usage/queries.ts
    - app/api/usage/route.ts
  modified:
    - package.json

key-decisions:
  - "Reset time: midnight in user's timezone (not UTC) for better UX"
  - "Free tier limit hardcoded to 3 generations per day"
  - "Race condition protection via atomic SQL increment with WHERE constraint"
  - "TZDate from @date-fns/tz for timezone-aware calculations"

patterns-established:
  - "Timezone detection: getUserTimezone() with Intl.DateTimeFormat fallback to UTC"
  - "Reset calculation: getNextMidnightUTC() converts local midnight to UTC Date"
  - "Query helpers: getUsage() handles create/reset, checkAndIncrementUsage() for atomic ops"
  - "API pattern: X-Timezone header for timezone context"

# Metrics
duration: 5min
completed: 2026-02-01
---

# Phase 07 Plan 01: Usage Limit Backend Summary

**Timezone-aware usage tracking with atomic increment protection using @date-fns/tz TZDate and SQL constraints**

## Performance

- **Duration:** 5 minutes 13 seconds
- **Started:** 2026-02-01T04:57:10Z
- **Completed:** 2026-02-01T05:02:23Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Timezone helpers for user-local midnight calculation and auto-reset
- Database query helpers with race condition protection via atomic SQL
- REST API endpoints for checking and incrementing usage quota
- Free tier enforcement: 3 generations per day with automatic midnight reset

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @date-fns/tz and create timezone helpers** - `a0e1f99` (feat)
2. **Task 2: Create usage limit query helpers** - `38f41d3` (feat)
3. **Task 3: Create usage API routes** - `f8b7988` (feat)

## Files Created/Modified

- `lib/usage/timezone.ts` - Timezone detection (getUserTimezone) and next midnight calculation (getNextMidnightUTC) using TZDate
- `lib/usage/queries.ts` - Database queries for usage limits with getUsage (handles create/reset) and checkAndIncrementUsage (atomic increment)
- `app/api/usage/route.ts` - GET (check status) and POST (increment) endpoints with auth and timezone support
- `package.json` - Added @date-fns/tz@1.4.1 dependency

## Decisions Made

**TIMEZONE-01: User's timezone for reset, not UTC**
- Rationale: Better UX - users think in local time, not UTC
- Implementation: X-Timezone header from client, TZDate for conversions
- Impact: Reset happens at user's local midnight

**LIMIT-01: Free tier hardcoded to 3 per day**
- Rationale: Simple constant for v2.0 launch, no subscription tiers yet
- Location: FREE_TIER_LIMIT constant in queries.ts
- Future: Will be replaced with subscription-based limits in Phase 8

**RACE-01: Atomic increment with SQL WHERE constraint**
- Rationale: Prevent race conditions when multiple requests hit simultaneously
- Implementation: `UPDATE ... SET usedCount = usedCount + 1 WHERE usedCount < limit`
- Effect: Only updates that satisfy constraint succeed, others return empty result

**API-01: X-Timezone header pattern**
- Rationale: Server needs user timezone for accurate reset calculation
- Fallback: UTC if header missing (safe default)
- Usage: `request.headers.get('X-Timezone') || 'UTC'`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Issue 1: @date-fns/tz API different from expected**
- **Problem:** Plan mentioned toZonedTime/fromZonedTime functions, but @date-fns/tz uses TZDate class
- **Investigation:** Checked package.json exports and type definitions
- **Solution:** Used TZDate constructor with timezone parameter for conversions
- **Result:** Cleaner API - TZDate makes date-fns operations work in specified timezone automatically

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next phases:**
- Usage backend complete for UI integration (Phase 07-02)
- Reset logic tested and working with timezone awareness
- API endpoints ready for frontend consumption

**Notes for integration:**
- Frontend must send X-Timezone header (use Intl.DateTimeFormat().resolvedOptions().timeZone)
- POST /api/usage should be called BEFORE generation starts
- 429 response means limit reached, show upgrade prompt
- resetAt timestamp can be displayed to users ("resets at...")

**No blockers identified.**

---
*Phase: 07-usage-limits*
*Completed: 2026-02-01*
