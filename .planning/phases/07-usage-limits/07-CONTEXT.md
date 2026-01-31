# Phase 7: Usage Limits - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Enforce daily generation quotas for free users with automatic reset and upgrade prompts. Free users are limited to 3 generations per day. Anonymous users must log in to generate — no anonymous generation allowed.

</domain>

<decisions>
## Implementation Decisions

### Authentication Requirement
- Anonymous users cannot generate posts — login required before generation
- This changes the core flow: form visible, but generate triggers auth check first
- Existing anonymous workflow from v1 is replaced with login-gated generation

### Counter Display
- Location: Header bar (always visible for free users)
- Format: Progress bar + text (e.g., "2/3 today")
- Visibility: Hidden when user is subscribed (no need to show "unlimited")
- Only visible for logged-in free users

### Limit Reached UX
- Generate button: Hidden entirely when limit reached
- Replacement: Upgrade CTA button in same location ("Upgrade for €X/month")
- Form state: Claude's discretion whether form is fillable when limited

### Upgrade Prompt
- CTA action: Direct to Stripe Checkout (no intermediate modal/page)
- Button text: Shows price inline (e.g., "Upgrade for €9/month")
- Tone: Friendly/helpful ("Get unlimited generations to grow your business")
- Pre-checkout: Brief tooltip/popover on hover showing key benefits before clicking

### Reset Timing
- Reset time: Midnight in user's timezone (not UTC)
- Timezone detection: Browser auto-detect via Intl.DateTimeFormat
- Countdown: Show countdown when limit reached (e.g., "Resets in 4h 23m")
- Update behavior: Resets on next user action, not real-time auto-refresh

### Claude's Discretion
- Progress bar color progression (green → yellow → red as approaching limit)
- Whether form remains fillable when limit reached
- Exact styling of upgrade CTA and tooltip
- Error handling for timezone detection edge cases

</decisions>

<specifics>
## Specific Ideas

- User sees "2/3 today" in header as persistent reminder
- When at 3/3, generate button is replaced with upgrade CTA showing price
- Hovering upgrade button shows brief benefits tooltip before Stripe redirect
- Countdown shows exact time until reset in user's local timezone

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-usage-limits*
*Context gathered: 2026-01-31*
