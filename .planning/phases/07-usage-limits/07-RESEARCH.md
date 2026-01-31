# Phase 7: Usage Limits - Research

**Researched:** 2026-01-31
**Domain:** Daily quota tracking, timezone handling, usage counter UI
**Confidence:** HIGH

## Summary

Phase 7 implements daily generation quotas for free users with automatic reset at midnight in the user's timezone. The core challenge is accurately calculating midnight in the user's local timezone (not UTC) and displaying remaining quota with a countdown timer.

**Key technical areas:**
1. Browser timezone detection using `Intl.DateTimeFormat().resolvedOptions().timeZone`
2. Daily reset logic stored in database with user timezone offset
3. Progress bar UI component showing "X/3 today" with color progression
4. Countdown timer displaying time until midnight reset
5. Optimistic UI updates for instant quota counter feedback
6. Authentication gate preventing anonymous users from generating

**Primary recommendation:** Use browser's native `Intl.DateTimeFormat` API for timezone detection (95%+ browser support), calculate midnight in user's timezone client-side, store reset timestamp in database, and use `date-fns` (already installed) for countdown calculations. Implement optimistic updates for counter using React 19's `useOptimistic` hook (already used in project for favorites).

## Standard Stack

### Core Libraries (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `date-fns` | 4.1.0 | Date calculations | Already in project, v4 has first-class timezone support via `@date-fns/tz` |
| `drizzle-orm` | 0.45.1 | Database queries | Already in project, used for `usageLimits` table |
| React `useOptimistic` | 19.0.0 | Optimistic UI | React 19 built-in, already used for favorites |
| React `useTransition` | 19.0.0 | Async state | React 19 built-in, already used for favorites |

### Additional Packages Needed
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@date-fns/tz` | Latest | Timezone calculations | For converting between user timezone and UTC in `date-fns` v4 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `Intl.DateTimeFormat` | `moment-timezone` | Moment is 67KB+ vs native API 0KB, project already avoiding Moment |
| `date-fns` | `dayjs` + plugin | date-fns already installed, switching adds dependency churn |
| Client-side timezone | Server-side UTC only | User timezone gives better UX ("resets at midnight" vs "resets at 2am") |

**Installation:**
```bash
npm install @date-fns/tz
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── api/
│   └── usage/
│       └── route.ts           # GET usage status, POST increment usage
├── components/
│   ├── UsageCounter.tsx       # Progress bar + countdown in header
│   └── UpgradeCTA.tsx         # Replaces generate button when limited
lib/
├── usage/
│   ├── queries.ts             # DB queries for usage limits
│   ├── timezone.ts            # Timezone detection and midnight calculation
│   └── countdown.ts           # Countdown timer hook
```

### Pattern 1: Browser Timezone Detection
**What:** Detect user's IANA timezone identifier client-side without permission prompts
**When to use:** On component mount or before calculating midnight reset time
**Example:**
```typescript
// lib/usage/timezone.ts
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g., "Europe/Vilnius"
  } catch (error) {
    console.warn('Timezone detection failed, falling back to UTC:', error);
    return 'UTC'; // Fallback for edge cases
  }
}

export function getTimezoneOffset(): number {
  // Returns offset in minutes (e.g., -120 for UTC+2)
  return new Date().getTimezoneOffset();
}
```

### Pattern 2: Calculating Midnight in User Timezone
**What:** Find next midnight in user's local timezone, convert to UTC for database storage
**When to use:** When creating/updating usage limit record with reset time
**Example:**
```typescript
// lib/usage/timezone.ts
import { addDays, startOfDay } from 'date-fns';
import { zonedTimeToUtc } from '@date-fns/tz';

export function getNextMidnightUTC(timezone: string): Date {
  // 1. Get current time in user's timezone
  const now = new Date();

  // 2. Get start of tomorrow in user's timezone
  const tomorrow = addDays(startOfDay(now), 1);

  // 3. Convert to UTC for database storage
  const midnightUTC = zonedTimeToUtc(tomorrow, timezone);

  return midnightUTC;
}
```

### Pattern 3: Countdown Timer to Reset
**What:** Display "Resets in 4h 23m" countdown to midnight
**When to use:** In UsageCounter component when limit is reached or approaching
**Example:**
```typescript
// lib/usage/countdown.ts
import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

export function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const secondsLeft = differenceInSeconds(targetDate, now);

      if (secondsLeft <= 0) {
        setTimeLeft('Resets now');
        return;
      }

      const hours = Math.floor(secondsLeft / 3600);
      const minutes = Math.floor((secondsLeft % 3600) / 60);

      setTimeLeft(`Resets in ${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}
```

### Pattern 4: Database Usage Tracking with Reset Check
**What:** Check if usage counter needs reset before incrementing
**When to use:** In `/api/usage` POST endpoint before allowing generation
**Example:**
```typescript
// lib/usage/queries.ts
import { db } from '@/app/db';
import { usageLimits } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

export async function checkAndIncrementUsage(
  userId: number,
  timezone: string
): Promise<{ allowed: boolean; used: number; limit: number; resetAt: Date }> {
  const limit = 3; // Free tier limit
  const now = new Date();

  // 1. Get or create usage record
  let usage = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.userId, userId))
    .limit(1);

  if (!usage || usage.length === 0) {
    // First time user - create record
    const resetAt = getNextMidnightUTC(timezone);
    const [newRecord] = await db.insert(usageLimits).values({
      userId,
      usedCount: 0,
      resetAt,
    }).returning();
    usage = [newRecord];
  }

  const record = usage[0];

  // 2. Check if reset needed
  if (now >= record.resetAt) {
    const resetAt = getNextMidnightUTC(timezone);
    const [reset] = await db
      .update(usageLimits)
      .set({ usedCount: 0, resetAt, updatedAt: now })
      .where(eq(usageLimits.id, record.id))
      .returning();
    record.usedCount = 0;
    record.resetAt = reset.resetAt;
  }

  // 3. Check if under limit
  if (record.usedCount >= limit) {
    return { allowed: false, used: record.usedCount, limit, resetAt: record.resetAt };
  }

  // 4. Increment counter
  await db
    .update(usageLimits)
    .set({ usedCount: record.usedCount + 1, updatedAt: now })
    .where(eq(usageLimits.id, record.id));

  return {
    allowed: true,
    used: record.usedCount + 1,
    limit,
    resetAt: record.resetAt
  };
}
```

### Pattern 5: Optimistic Counter Updates
**What:** Instantly update counter in UI before API confirmation
**When to use:** In generate button click handler to show immediate feedback
**Example:**
```typescript
// app/components/UsageCounter.tsx
'use client';

import { useOptimistic, useTransition } from 'react';

export function UsageCounter({ initialUsed, limit, resetAt }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticUsed, setOptimisticUsed] = useOptimistic(initialUsed);

  const handleGenerate = () => {
    startTransition(async () => {
      // Optimistically increment counter
      setOptimisticUsed(optimisticUsed + 1);

      try {
        const response = await fetch('/api/usage', { method: 'POST' });
        const data = await response.json();

        if (!data.allowed) {
          // Counter will sync on next render
          console.log('Limit reached');
        }
      } catch (error) {
        console.error('Failed to increment usage:', error);
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <ProgressBar used={optimisticUsed} limit={limit} />
      <span className="text-sm text-gray-600">{optimisticUsed}/{limit} today</span>
    </div>
  );
}
```

### Pattern 6: Progress Bar with Color Progression
**What:** Visual progress bar that changes color as quota fills (green → yellow → red)
**When to use:** In header for free users to show quota status
**Example:**
```typescript
// app/components/UsageCounter.tsx
function getProgressBarColor(used: number, limit: number): string {
  const percentage = (used / limit) * 100;

  if (percentage >= 100) return 'bg-red-500';
  if (percentage >= 66) return 'bg-yellow-500';
  if (percentage >= 33) return 'bg-blue-500';
  return 'bg-green-500';
}

function ProgressBar({ used, limit }: { used: number; limit: number }) {
  const percentage = Math.min((used / limit) * 100, 100);
  const colorClass = getProgressBarColor(used, limit);

  return (
    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${colorClass}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Storing timezone string in database:** User's timezone can change (travel, DST transitions). Always detect client-side on each request.
- **UTC-only reset logic:** Resetting at UTC midnight means different reset times for users in different timezones (poor UX).
- **Real-time auto-refresh counters:** Causes unnecessary re-renders and API calls. Update on user action only (as per CONTEXT.md decision).
- **Incrementing before checking reset:** Always check if reset is needed before incrementing to avoid off-by-one errors.
- **Client-side only enforcement:** Must validate quota server-side in API to prevent bypassing via DevTools.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Countdown timer calculation | Custom interval with Date math | `date-fns` `differenceInSeconds` | Handles edge cases, DST transitions, leap seconds |
| Timezone conversion | Manual offset arithmetic | `@date-fns/tz` `zonedTimeToUtc` | Accounts for DST, historical timezone changes, IANA database |
| Progress bar animation | Custom CSS/JS animation | Tailwind `transition-all` + width | Built-in, performant, accessible |
| Optimistic UI state | Custom pending state tracking | React 19 `useOptimistic` | Automatic rollback, race condition handling |
| Relative time formatting | String concatenation | `date-fns` `formatDistanceToNow` | Already in project, i18n ready (Lithuanian locale) |

**Key insight:** Timezone and date calculations have edge cases (DST transitions, leap years, timezone definition changes) that are easy to get wrong. date-fns v4 handles these with well-tested code and IANA timezone database.

## Common Pitfalls

### Pitfall 1: DST Transition Bugs
**What goes wrong:** Countdown shows incorrect time or negative values during DST transitions
**Why it happens:** Clock "springs forward" (2am → 3am) or "falls back" (2am → 1am) causing midnight to shift by 1 hour
**How to avoid:**
- Use `@date-fns/tz` which handles DST automatically via IANA timezone database
- Test specifically around DST transition dates (March 8, 2026 for US)
- Store reset time as UTC timestamp, convert to user timezone only for display
**Warning signs:**
- Countdown shows "Resets in -1h" or jumps by 1 hour unexpectedly
- Users report quota not resetting at expected time
- Errors in console about invalid date calculations

### Pitfall 2: Race Condition on Limit Check
**What goes wrong:** Two concurrent requests both pass limit check, allowing 4/3 generations
**Why it happens:** Database read (check limit) and write (increment) are separate operations without transaction isolation
**How to avoid:**
```typescript
// BAD: Separate read and write
const usage = await getUsage(userId);
if (usage.count >= 3) return { allowed: false };
await incrementUsage(userId); // Race: another request might increment between read and write

// GOOD: Atomic increment with constraint check
const result = await db
  .update(usageLimits)
  .set({ usedCount: sql`${usageLimits.usedCount} + 1` })
  .where(and(
    eq(usageLimits.userId, userId),
    sql`${usageLimits.usedCount} < 3` // Constraint in WHERE clause
  ))
  .returning();

if (result.length === 0) {
  // Update failed = limit reached
  return { allowed: false };
}
```
**Warning signs:**
- `usedCount` exceeds limit in database
- Logs show multiple generations at exactly the same timestamp
- Users report being able to generate more than limit

### Pitfall 3: Timezone Detection Edge Cases
**What goes wrong:** `Intl.DateTimeFormat` fails in old browsers, privacy-focused browsers, or returns unexpected values
**Why it happens:**
- <1% of browsers don't support IANA timezone identifiers
- Privacy browsers may return "UTC" to prevent fingerprinting
- System timezone set to obsolete identifier
**How to avoid:**
```typescript
export function getUserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Validate it's a real IANA timezone (basic check)
    if (!tz || tz === '') {
      console.warn('Empty timezone, falling back to UTC');
      return 'UTC';
    }

    return tz;
  } catch (error) {
    console.warn('Timezone detection failed:', error);
    return 'UTC'; // Graceful degradation
  }
}
```
**Warning signs:**
- Error logs showing timezone parsing failures
- Users in different timezones seeing identical reset times
- Countdown timer shows wrong values for specific users

### Pitfall 4: Midnight on DST Transition Day
**What goes wrong:** On DST "spring forward" day (March 8, 2026), 2am doesn't exist (jumps to 3am). If calculating midnight for that day, you might get 1am or 3am instead.
**Why it happens:** Some timezones change clocks at midnight itself, causing date rollover ambiguity
**How to avoid:** Use `startOfDay` from date-fns which handles DST transitions correctly
```typescript
// BAD: Manual midnight calculation
const midnight = new Date(year, month, day, 0, 0, 0); // Might skip or double an hour

// GOOD: Use date-fns startOfDay
import { startOfDay, addDays } from 'date-fns';
const tomorrow = addDays(new Date(), 1);
const midnight = startOfDay(tomorrow); // Handles DST correctly
```
**Warning signs:**
- Reset times off by 1 hour on specific dates
- Logs show resetAt timestamps at 23:00 or 01:00 instead of 00:00
- User complaints concentrated around DST transition dates

### Pitfall 5: Forgetting Server-Side Validation
**What goes wrong:** Client-side quota check can be bypassed via browser DevTools or API tools
**Why it happens:** Trusting client-sent "I'm under quota" flag without server verification
**How to avoid:**
- **ALWAYS** check quota in API route before processing generation
- Treat client-side check as UX optimization only, not security
- Log quota violations for monitoring abuse
```typescript
// app/api/generate/route.ts
export async function POST(request: Request) {
  const userId = await getUserId(request);

  // CRITICAL: Check quota server-side
  const { allowed, used, limit } = await checkAndIncrementUsage(userId, timezone);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Daily limit reached', used, limit },
      { status: 429 } // Too Many Requests
    );
  }

  // Proceed with generation...
}
```
**Warning signs:**
- Database shows usage spikes inconsistent with UI state
- Power users generating more than expected
- API costs higher than quota limits suggest

## Code Examples

Verified patterns from official sources:

### Timezone Detection and Storage
```typescript
// lib/usage/timezone.ts
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat

/**
 * Get user's IANA timezone identifier
 * Returns: "Europe/Vilnius", "America/New_York", etc.
 * Fallback: "UTC" if detection fails
 */
export function getUserTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (!timezone || timezone === '') {
      return 'UTC';
    }

    return timezone;
  } catch (error) {
    console.warn('Timezone detection failed, using UTC:', error);
    return 'UTC';
  }
}

/**
 * Calculate next midnight in user's timezone, return as UTC
 * Used for setting resetAt timestamp in database
 */
import { addDays, startOfDay } from 'date-fns';
import { zonedTimeToUtc } from '@date-fns/tz';

export function getNextMidnightUTC(timezone: string): Date {
  const now = new Date();
  const tomorrow = addDays(startOfDay(now), 1);

  // Convert tomorrow midnight in user's timezone to UTC
  return zonedTimeToUtc(tomorrow, timezone);
}
```

### Countdown Timer Hook
```typescript
// lib/usage/countdown.ts
// Source: https://date-fns.org/ (intervalToDuration, differenceInSeconds)

import { useState, useEffect } from 'react';
import { differenceInSeconds, intervalToDuration } from 'date-fns';

export function useCountdown(resetAt: Date) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const secondsRemaining = differenceInSeconds(resetAt, now);

      if (secondsRemaining <= 0) {
        setCountdown('Resets now');
        return;
      }

      const duration = intervalToDuration({ start: now, end: resetAt });

      // Format as "4h 23m" or "23m" if < 1 hour
      const hours = duration.hours || 0;
      const minutes = duration.minutes || 0;

      if (hours > 0) {
        setCountdown(`Resets in ${hours}h ${minutes}m`);
      } else {
        setCountdown(`Resets in ${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [resetAt]);

  return countdown;
}
```

### Usage Counter Component with Progress Bar
```typescript
// app/components/UsageCounter.tsx
'use client';

import { useCountdown } from '@/lib/usage/countdown';

interface UsageCounterProps {
  used: number;
  limit: number;
  resetAt: Date;
}

export function UsageCounter({ used, limit, resetAt }: UsageCounterProps) {
  const countdown = useCountdown(resetAt);
  const percentage = Math.min((used / limit) * 100, 100);

  // Color progression: green → blue → yellow → red
  const getColor = () => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 66) return 'bg-yellow-500';
    if (percentage >= 33) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Progress bar */}
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
        />
      </div>

      {/* Text counter */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700">
          {used}/{limit} today
        </span>
        {used >= limit && (
          <span className="text-xs text-gray-500">{countdown}</span>
        )}
      </div>
    </div>
  );
}
```

### API Route for Usage Check and Increment
```typescript
// app/api/usage/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/app/db';
import { users, usageLimits } from '@/app/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getNextMidnightUTC, getUserTimezone } from '@/lib/usage/timezone';

/**
 * GET /api/usage - Get current usage status
 * Returns: { used, limit, resetAt }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get user ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, authUser.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Get usage record (or create)
    const limit = 3;
    const timezone = getUserTimezone(); // From query param or header
    const now = new Date();

    let [usage] = await db
      .select()
      .from(usageLimits)
      .where(eq(usageLimits.userId, user.id))
      .limit(1);

    if (!usage) {
      const resetAt = getNextMidnightUTC(timezone);
      [usage] = await db.insert(usageLimits).values({
        userId: user.id,
        usedCount: 0,
        resetAt,
      }).returning();
    }

    // 4. Check if reset needed
    if (now >= usage.resetAt) {
      const resetAt = getNextMidnightUTC(timezone);
      [usage] = await db
        .update(usageLimits)
        .set({ usedCount: 0, resetAt, updatedAt: now })
        .where(eq(usageLimits.id, usage.id))
        .returning();
    }

    return NextResponse.json({
      used: usage.usedCount,
      limit,
      resetAt: usage.resetAt.toISOString(),
    });

  } catch (error) {
    console.error('GET /api/usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/usage - Increment usage counter
 * Returns: { allowed, used, limit, resetAt }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get user ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, authUser.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const limit = 3;
    const timezone = request.headers.get('X-Timezone') || getUserTimezone();
    const now = new Date();

    // 3. Get or create usage record
    let [usage] = await db
      .select()
      .from(usageLimits)
      .where(eq(usageLimits.userId, user.id))
      .limit(1);

    if (!usage) {
      const resetAt = getNextMidnightUTC(timezone);
      [usage] = await db.insert(usageLimits).values({
        userId: user.id,
        usedCount: 0,
        resetAt,
      }).returning();
    }

    // 4. Check if reset needed
    if (now >= usage.resetAt) {
      const resetAt = getNextMidnightUTC(timezone);
      [usage] = await db
        .update(usageLimits)
        .set({ usedCount: 0, resetAt, updatedAt: now })
        .where(eq(usageLimits.id, usage.id))
        .returning();
    }

    // 5. Check if already at limit
    if (usage.usedCount >= limit) {
      return NextResponse.json({
        allowed: false,
        used: usage.usedCount,
        limit,
        resetAt: usage.resetAt.toISOString(),
      }, { status: 429 }); // Too Many Requests
    }

    // 6. Atomic increment with constraint
    const [updated] = await db
      .update(usageLimits)
      .set({
        usedCount: sql`${usageLimits.usedCount} + 1`,
        updatedAt: now
      })
      .where(and(
        eq(usageLimits.id, usage.id),
        sql`${usageLimits.usedCount} < ${limit}` // Race condition protection
      ))
      .returning();

    if (!updated) {
      // Race condition: another request incremented to limit
      return NextResponse.json({
        allowed: false,
        used: limit,
        limit,
        resetAt: usage.resetAt.toISOString(),
      }, { status: 429 });
    }

    return NextResponse.json({
      allowed: true,
      used: updated.usedCount,
      limit,
      resetAt: updated.resetAt.toISOString(),
    });

  } catch (error) {
    console.error('POST /api/usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| UTC-only reset times | User timezone-aware reset | 2020+ | Better UX - users see "midnight" not "2am" |
| `moment-timezone` (67KB) | Native `Intl` + `date-fns` (<10KB) | 2021+ | 85% smaller bundle, native browser support |
| Server-calculated countdown | Client-calculated with hooks | 2019+ (React Hooks) | Reduces server load, real-time updates |
| Custom optimistic state | React 19 `useOptimistic` | 2024 (React 19) | Simpler code, automatic rollback handling |
| Fixed window rate limiting | Fixed window with reset tracking | 2022+ | Prevents burst at window edge, fairer quotas |
| Manual timezone offset math | `@date-fns/tz` IANA database | 2023+ (date-fns v3/4) | Handles DST transitions, historical changes |

**Deprecated/outdated:**
- **moment.js**: Project explicitly avoiding (per Phase 2 research), use date-fns instead
- **getTimezoneOffset() only**: Returns minutes offset, not IANA identifier (loses DST info)
- **localStorage quota tracking**: Can be cleared by user, use database as source of truth
- **Real-time WebSocket counters**: Overkill for daily quotas, update on action sufficient

## Open Questions

Things that couldn't be fully resolved:

1. **Subscription status check location**
   - What we know: Phase 8 will add Stripe subscriptions, subscribed users get unlimited generations
   - What's unclear: Whether to check subscription in `/api/usage` or `/api/generate` endpoint
   - Recommendation: Check in both - `/api/usage` returns `isSubscribed: true` (skips counter display), `/api/generate` checks subscription before quota (allows unlimited)

2. **Anonymous user prevention mechanism**
   - What we know: CONTEXT.md says "login required before generation" but form visible
   - What's unclear: Whether to check auth in generate button click handler or API route
   - Recommendation: Check in both - button shows sign-in prompt (UX), API returns 401 (security)

3. **Timezone sent from client or server-detected**
   - What we know: Browser can detect via `Intl.DateTimeFormat`
   - What's unclear: Whether to trust client-sent timezone or have server use UTC offset calculation
   - Recommendation: Client sends IANA timezone in request header (`X-Timezone`), server validates it's valid IANA identifier, falls back to UTC if invalid (prevents manipulation)

4. **Reset check frequency optimization**
   - What we know: Reset check happens on each generation request
   - What's unclear: Whether to add background job to reset all users at midnight or keep lazy reset
   - Recommendation: Keep lazy reset (simpler), add database index on `resetAt` for fast queries, consider background job only if scaling to 100K+ users

## Sources

### Primary (HIGH confidence)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) - Timezone detection API
- [date-fns v4.0 with timezone support](https://blog.date-fns.org/v40-with-time-zone-support/) - Official announcement
- [date-fns documentation](https://date-fns.org/) - Date calculations and countdown functions
- [React useOptimistic documentation](https://react.dev/reference/react/useOptimistic) - Optimistic UI updates
- [PostgreSQL timestamp with timezone](https://www.postgresql.org/docs/current/datatype-datetime.html) - Database timestamp storage

### Secondary (MEDIUM confidence)
- [Rate limiting in system design (GeeksforGeeks)](https://www.geeksforgeeks.org/system-design/rate-limiting-in-system-design/) - Fixed window counter algorithm
- [Designing an API Rate Limiter](https://aaronice.gitbook.io/system-design/system-design-problems/designing-an-api-rate-limiter) - Quota reset patterns
- [Tailwind CSS Progress Bar (Flowbite)](https://flowbite.com/docs/components/progress/) - Progress bar UI components
- [SaaS CTA button best practices (Design Studio UI/UX)](https://www.designstudiouiux.com/blog/cta-button-design-best-practices/) - Upgrade CTA patterns
- [TanStack Query optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) - Alternative optimistic update patterns

### Tertiary (LOW confidence - for validation during planning)
- [DST edge cases (timeanddate.com)](https://www.timeanddate.com/time/dst/) - Daylight saving time transition dates
- [Race conditions in rate limiting (PortSwigger)](https://portswigger.net/web-security/race-conditions/lab-race-conditions-bypassing-rate-limits) - Security considerations
- [Timezone conversion bugs (GitHub dayjs issue)](https://github.com/iamkun/dayjs/issues/1260) - Common library bugs during DST

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - date-fns already installed, React 19 features verified in existing code
- Architecture: HIGH - Timezone APIs verified via MDN, patterns match existing project structure
- Pitfalls: MEDIUM - Based on real issues from search results, but not all tested in current project

**Research date:** 2026-01-31
**Valid until:** 2026-03-31 (2 months - date-fns and React are stable, timezone database updates quarterly)

**Notes:**
- Database schema for `usageLimits` table already exists in project (confirmed in schema.ts)
- Project already uses React 19 `useOptimistic` for favorites (confirmed in FavoriteButton.tsx)
- Project already uses `date-fns` v4.1.0 with Lithuanian locale (confirmed in package.json and PostCard.tsx)
- DST transition date for 2026: March 8 (US) - should test around this date
