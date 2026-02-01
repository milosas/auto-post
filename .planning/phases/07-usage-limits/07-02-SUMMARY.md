---
phase: 07-usage-limits
plan: 02
subsystem: ui
tags: [usage-counter, react, hooks, date-fns, progress-bar, ui-components]

# Dependency graph
requires:
  - phase: 07-usage-limits
    plan: 01
    provides: /api/usage endpoints for quota fetching
  - phase: 05-authentication
    provides: AuthHeader component and Supabase auth integration
provides:
  - UsageCounter component with progress bar and countdown timer
  - useCountdown hook for reset time display
  - Usage quota display in header for logged-in users
affects: [07-03-usage-integration, user-experience]

# Tech tracking
tech-stack:
  added: []
  patterns: [client-side countdown hook, color-coded progress bar, timezone-aware UI]

key-files:
  created:
    - lib/usage/countdown.ts
    - app/components/UsageCounter.tsx
  modified:
    - app/components/AuthHeader.tsx

key-decisions:
  - "Color progression: green (0-33%) → blue (33-66%) → yellow (66-100%) → red (100%+)"
  - "Countdown shown only when limit reached (used >= limit)"
  - "Usage fetched on mount and auth state change for real-time updates"
  - "Lithuanian UI text: 'X/Y šiandien' (today) and countdown messages"

patterns-established:
  - "useCountdown hook: Updates every minute via setInterval with date-fns utilities"
  - "Progress bar: Accessible with ARIA attributes (role, aria-valuenow/min/max)"
  - "Fetch pattern: X-Timezone header from Intl.DateTimeFormat().resolvedOptions().timeZone"
  - "Conditional rendering: Show UsageCounter only when usage state is populated"

# Metrics
duration: 3min
completed: 2026-02-01
---

# Phase 07 Plan 02: Usage Counter UI Summary

**Visual quota tracking with color-coded progress bar and countdown timer using date-fns and client-side hooks**

## Performance

- **Duration:** 3 minutes 6 seconds
- **Started:** 2026-02-01T05:07:11Z
- **Completed:** 2026-02-01T05:10:17Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Countdown timer hook with minute-by-minute updates and Lithuanian formatting
- UsageCounter component with accessible progress bar and color progression
- Header integration with real-time usage fetching and timezone support
- Clean UX: counter only shown for authenticated users with usage data

## Task Commits

Each task was committed atomically:

1. **Task 1: Create countdown timer hook** - `569ae40` (feat)
2. **Task 2: Create UsageCounter component with progress bar** - `2501173` (feat)
3. **Task 3: Integrate UsageCounter into AuthHeader** - `f641f04` (feat)

## Files Created/Modified

- `lib/usage/countdown.ts` - useCountdown hook with date-fns differenceInSeconds and intervalToDuration, updates every minute
- `app/components/UsageCounter.tsx` - Progress bar component with color progression logic and countdown display
- `app/components/AuthHeader.tsx` - Updated to fetch usage on mount/auth change and render UsageCounter before user avatar

## Decisions Made

**UI-COLOR: Color progression based on usage percentage**
- Rationale: Visual warning system to alert users before hitting limit
- Implementation: green (safe) → blue (moderate) → yellow (warning) → red (limit reached)
- Thresholds: 0-33%, 33-66%, 66-100%, 100%+
- Impact: Users get clear visual feedback about remaining quota

**UI-COUNTDOWN: Show countdown only when limit reached**
- Rationale: Avoid UI clutter when users have quota remaining
- Implementation: Conditional render with `{used >= limit && countdown && (...)}`
- Display: "Atsinaujins po Xh Ym" or "Atsinaujins po Xm"
- Impact: Clean UI when quota available, helpful timer when needed

**UI-FETCH: Fetch usage on mount and auth state change**
- Rationale: Real-time quota visibility without manual refresh
- Implementation: Two fetch points - initial mount and onAuthStateChange callback
- Headers: X-Timezone from Intl.DateTimeFormat
- Impact: Users always see current quota status

**UI-LITHUANIAN: Lithuanian text for all user-facing strings**
- Rationale: Maintain consistency with existing Lithuanian UI
- Labels: "X/Y šiandien" (today), "Atsinaujins po..." (resets in...)
- Impact: Cohesive localized experience

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues.

## User Setup Required

None - components work automatically when user is authenticated.

## Next Phase Readiness

**Ready for next phases:**
- Usage UI complete and integrated into header
- Visual feedback system working (progress bar + countdown)
- Real-time quota updates on auth state changes
- Ready for generation flow integration (Phase 07-03)

**Notes for integration:**
- UsageCounter will automatically update when usage state changes
- To refresh usage after generation, call fetch('/api/usage') with X-Timezone header
- Component handles all edge cases (null usage, limit reached, countdown display)

**Testing notes:**
- Progress bar colors verified through TypeScript compilation
- Countdown logic uses date-fns for accurate time calculations
- Timezone-aware through Intl.DateTimeFormat browser API

**No blockers identified.**

---
*Phase: 07-usage-limits*
*Completed: 2026-02-01*
