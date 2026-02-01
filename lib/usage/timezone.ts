import { addDays, startOfDay } from 'date-fns';
import { TZDate } from '@date-fns/tz';

/**
 * Detect user's IANA timezone from browser.
 *
 * @returns Timezone string (e.g., "Europe/Vilnius") or "UTC" as fallback
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Calculate next midnight in user's timezone and return as UTC Date.
 *
 * Per CONTEXT.md: Reset time is midnight in user's timezone (not UTC) for better UX.
 *
 * Implementation:
 * 1. Get current time in user's timezone using TZDate
 * 2. Calculate tomorrow midnight in that timezone
 * 3. TZDate automatically handles conversion to/from UTC
 *
 * @param timezone - IANA timezone string (e.g., "Europe/Vilnius")
 * @returns UTC Date representing next midnight in user's timezone
 */
export function getNextMidnightUTC(timezone: string): Date {
  // 1. Get current time in user's timezone
  const nowInTz = new TZDate(new Date(), timezone);

  // 2. Calculate tomorrow midnight in that timezone
  // TZDate makes date-fns operations work in the specified timezone
  const tomorrowMidnight = startOfDay(addDays(nowInTz, 1));

  // 3. Return as regular Date (TZDate extends Date, stores UTC internally)
  return new Date(tomorrowMidnight);
}
