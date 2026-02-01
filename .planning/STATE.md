# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-29)

**Core value:** Users can generate a professional, industry-appropriate social media post in under 60 seconds without any account creation or complex setup.

**Current focus:** Phase 8 - Payments (in progress)

## Current Position

Phase: 8 of 9 (Payments) — In progress
Plan: 2 of 5 complete (Stripe API Routes)
Status: Phase 8 in progress
Last activity: 2026-02-01 — Completed 08-02-PLAN.md (Stripe API Routes)

Progress: [█████████░] 91% (v1.0 complete, Phases 4-7 complete, Phase 8 plan 2/5)

**Note:** Phase 5 implemented with Supabase Auth instead of Clerk (simpler integration).

## Performance Metrics

**v1.0 Milestone (Completed):**
- Total plans completed: 9
- Total phases: 3
- Average plan duration: 8.7 minutes
- Total execution time: 1.33 hours
- Timeline: 3 days (2026-01-25 → 2026-01-27)

**v2.0 Milestone (In Progress):**
- Total plans completed: 17
- Total phases: 6 (Phases 4-9)
- Phases completed: 4 (Phases 4-7)
- Average plan duration: 5.1 minutes
- Status: Phase 8 plan 2/5 complete (Stripe API Routes)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

**v1.0 decisions:**
- Direct OpenAI for text generation (simpler setup than proxy)
- Edge Runtime for streaming (25s timeout vs 10s serverless)
- Optional rate limiting (graceful degradation in dev)
- DALL-E 3 over Flux (same OpenAI API, simpler integration)

**v2.0 stack decisions (from research):**
- **Supabase Auth** for authentication (changed from Clerk - simpler integration with existing Supabase DB)
- Supabase Postgres + Drizzle ORM (user choice, EU West region)
- Stripe for payments (subscriptions + credits)

**Phase 4 (Database Foundation) decisions:**
- generatedAlwaysAsIdentity() over serial (PostgreSQL 15+ standard)
- Soft delete with partial unique indexes (email reuse after deletion)
- Index all foreign key columns (query performance)
- JSONB for generation config (flexible without schema migrations)

**Phase 5 (Authentication) decisions:**
- AUTH-01: Supabase Auth over Clerk (unified with existing Supabase DB, no separate service)
- AUTH-02: Custom sign-in/sign-up forms with Lithuanian UI (full control over UX)
- AUTH-03: Supabase SSR with @supabase/ssr (proper cookie handling for Next.js 15)
- AUTH-04: Disabled email confirmation for development (Supabase rate limits)
- AUTH-05: Auto-login after registration (better UX, skip email verification step)

**Phase 6 Plan 01 (Storage and Query Helpers) decisions:**
- STORAGE-01: Service role key for uploads (bypasses RLS, allows server-side uploads on behalf of users)
- PAGINATION-01: Cursor-based pagination over offset-based (stable pagination, better performance)
- SEARCH-01: ILIKE for case-insensitive search (simple, sufficient for v2.0)

**Phase 6 Plan 02 (Post CRUD API Routes) decisions:**
- API-01: Node.js runtime over Edge runtime (Drizzle requires Node.js built-ins)
- API-02: Internal user ID lookup pattern (auth ID → internal ID for every request)
- API-03: Error responses return JSON for consistency (even 204 uses NextResponse)

**Phase 6 Plan 03 (Save Post Button) decisions:**
- UI-01: Keep saved state persistent to prevent duplicate saves
- UI-02: Show sign-in prompt for unauthenticated users with generated content
- UI-03: Map emoji config value: 'no' = false, all others = true

**Phase 6 Plan 04 (History UI Pages) decisions:**
- UI-04: react-intersection-observer for infinite scroll (simple, performant)
- UI-05: date-fns with Lithuanian locale for date formatting (i18n support)
- UI-06: URL searchParams for regenerate flow (shareable URLs, no storage limits)
- UI-07: Date serialization to ISO strings for Server->Client components (Next.js 15 requirement)

**Phase 6 Plan 05 (Search and Favorites) decisions:**
- UI-08: URL-based filtering for shareable links (search and favorites params)
- UI-09: useOptimistic for instant favorite toggle feedback
- UI-10: 300ms debounce for search to avoid excessive API calls

**Phase 7 Plan 01 (Usage Limit Backend) decisions:**
- TIMEZONE-01: User's timezone for reset (not UTC) - better UX, users think in local time
- LIMIT-01: Free tier hardcoded to 3 per day - simple constant for v2.0, will be subscription-based later
- RACE-01: Atomic increment with SQL WHERE constraint - prevents race conditions
- API-01: X-Timezone header pattern - server needs user timezone for reset calculation

**Phase 7 Plan 02 (Usage Counter UI) decisions:**
- UI-COLOR: Color progression green→blue→yellow→red based on usage percentage (visual warning system)
- UI-COUNTDOWN: Show countdown timer only when limit reached (avoid UI clutter)
- UI-FETCH: Fetch usage on mount and auth state change (real-time quota visibility)
- UI-LITHUANIAN: Lithuanian text for all user-facing strings (maintain consistency)

**Phase 7 Plan 03 (Upgrade CTA and Quota Enforcement) decisions:**
- RUNTIME-01: Switch /api/generate from Edge to Node.js runtime - Edge-to-Node fetch loses Supabase session, direct Drizzle access simpler
- AUTH-06: Authentication required before generation - prevents anonymous abuse, enforces usage limits
- UX-01: Upgrade CTA with gradient button and benefits tooltip - €9/month price, clear visual differentiation

**Phase 7 Plan 04 (Main Page Limit Integration) decisions:**
- UI-REFETCH: Refetch usage after each generation (not optimistic update) - ensures UI stays in sync with server state
- UI-LOADING: Show skeleton button during usage fetch - prevents flash of wrong state
- UI-AUTH-GATE: Disabled button with clear sign-in links for unauthenticated users - conversion optimization

**Phase 8 Plan 01 (Stripe Foundation) decisions:**
- STRIPE-01: API version 2026-01-28.clover (latest supported by stripe@20.3.0 SDK)
- STRIPE-02: Price IDs from environment variables for flexibility across dev/staging/prod environments
- STRIPE-03: Installed pg driver for direct SQL execution (drizzle-kit push had constraint parsing bug)

**Phase 8 Plan 02 (Stripe API Routes) decisions:**
- API-CHECKOUT-01: Get or create Stripe customer pattern (check subscriptions table first, create if missing)
- API-CHECKOUT-02: Metadata correlation (all checkout sessions include userId and relevant IDs for webhook handling)
- API-CHECKOUT-03: mode: 'subscription' for recurring plans, mode: 'payment' for one-time credit purchases

### Pending Todos

None yet.

### Blockers/Concerns

**Carry forward from v1:**
- OUT-03 inline text editing (tech debt - users regenerate instead)
- DALL-E content policy unpredictable with Lithuanian prompts
- Next.js 15.1.4 security vulnerability (npm warning - need to upgrade)

**v2.0 considerations:**
- **Phase 5:** OAuth approval delays - Google verification takes 3-7 days, Facebook requires 6+ resubmissions. Start application process 3 weeks before launch.
- **Phase 6:** DALL-E URL expiration - Image URLs may expire after 30-90 days. Verify expiration policy and implement Cloudflare R2 storage if needed.
- **Phase 8:** Stripe webhook idempotency - Research flags this as needing deeper investigation during planning (multiple implementation patterns exist).
- **Phase 8 Plan 02:** Customer Portal must be configured in Stripe Dashboard (Settings → Billing → Customer Portal → Activate) before /api/stripe/portal will work.

## Session Continuity

Last session: 2026-02-01 15:09 UTC
Stopped at: Completed 08-02-PLAN.md (Stripe API Routes) - Phase 8 plan 2/5 complete
Resume file: None

Config:
model_profile: balanced
commit_docs: true
