# Roadmap: Social Post Generator v2.0

## Overview

Transform the anonymous v1 MVP into a credible SaaS product by adding authentication (Clerk), database persistence (Supabase Postgres + Drizzle), post history, usage-based monetization (Stripe), and a user dashboard. The roadmap preserves the existing anonymous workflow while adding progressive authentication—users experience value before signup, then upgrade to save their work. Phases follow natural dependencies: Database → Auth → History → Usage Limits → Payments → Dashboard.

## Milestones

- **v1.0 MVP** - Phases 1-3 (shipped 2026-01-27)
- **v2.0 User System + Monetization** - Phases 4-9 (shipped 2026-02-02)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-3) - SHIPPED 2026-01-27</summary>

### Phase 1: Foundation
**Goal**: Project scaffolding and core infrastructure
**Status**: Complete

Delivered AI-powered post generator for Lithuanian service providers with 20 industry categories, streaming text generation, and image upload/generation capabilities.

### Phase 2: Core Generator
**Goal**: Post generation workflow
**Status**: Complete

Delivered fuzzy autocomplete industry selector, post configuration (topic, tone, emoji, length), streaming OpenAI text generation, and regenerate functionality.

### Phase 3: Image & Preview
**Goal**: Image handling and social previews
**Status**: Complete

Delivered drag-drop image upload (max 5MB), DALL-E 3 AI generation, Facebook/Instagram mock preview, mobile/desktop toggle, and multi-format download (PNG/JPEG).

</details>

### v2.0 User System + Monetization (SHIPPED 2026-02-02)

**Milestone Goal:** Transform anonymous tool into SaaS with user accounts, post history, and Stripe payments. **COMPLETE**

#### Phase 4: Database Foundation

**Goal**: Establish database infrastructure for all user-specific features

**Status**: Complete (2026-01-29)

**Depends on**: Phase 3 (v1 shipped)

**Requirements**: Database schema design (foundational work)

**Success Criteria** (verified):
1. Supabase Postgres database provisioned and connected
2. Drizzle ORM configured with postgres.js driver
3. Database schema defined for users, posts, subscriptions, and usage_limits tables
4. Schema pushed via drizzle-kit push
5. Database queries work from API routes (/api/db-health verified)

**Plans**: 2 plans (complete)

Plans:
- [x] 04-01-PLAN.md - Install Drizzle ORM and create database schema
- [x] 04-02-PLAN.md - Push schema to Supabase and verify connectivity

#### Phase 5: Authentication

**Goal**: Users can securely create accounts and authenticate across sessions

**Depends on**: Phase 4 (database must exist to store user records)

**Implementation**: Supabase Auth (changed from Clerk for unified Supabase stack)

**Status**: Complete (2026-01-31)

**Success Criteria** (all TRUE):
1. User can sign up with email/password
2. User can log in with email/password
3. User can log in with Google OAuth (configured in Supabase)
4. User can log in with magic link (passwordless)
5. User session persists across browser refresh
6. User can log out from any page (AuthHeader integrated)
7. Anonymous users can still access generation workflow
8. Auth user syncs to database users table

**Delivered:**
- Supabase SSR setup (lib/supabase/client.ts, server.ts, middleware.ts)
- Sign-in page with Google OAuth, email/password, magic link (/sign-in)
- Sign-up page with Google OAuth, email/password (/sign-up)
- OAuth callback handler with user sync (/auth/callback)
- Session middleware for Next.js 15
- AuthHeader component integrated into main page
- Auto-login after registration (dev mode)
- User sync API (lib/auth/sync-user.ts, /api/auth/sync)

#### Phase 6: Post History

**Goal**: Users can save, view, and manage their generated posts

**Depends on**: Phase 5 (requires authenticated users with user_id)

**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04, HIST-05, HIST-06, HIST-07, HIST-08

**Status**: Complete (2026-01-31)

**Success Criteria** (verified):
1. Generated posts save to database with text, image URL, and generation config
2. User can view list of saved posts with date, thumbnail, and text preview
3. User can view individual post details with full text and image
4. User can copy text from saved post with one click
5. User can regenerate post from saved configuration
6. User can search posts by text content
7. User can mark posts as favorites and view favorites separately

**Delivered:**
- Supabase Storage for permanent DALL-E image storage (lib/supabase/storage.ts)
- Drizzle query helpers for posts CRUD with cursor pagination (lib/posts/queries.ts)
- Posts API routes (app/api/posts/route.ts, app/api/posts/[id]/route.ts)
- SavePostButton with loading states (app/components/SavePostButton.tsx)
- History list with infinite scroll (app/history/page.tsx, PostHistoryList.tsx)
- Post detail with copy and regenerate (app/history/[id]/page.tsx)
- Search with 300ms debounce (SearchBar.tsx)
- Favorites with optimistic updates (FavoriteButton.tsx)

**Plans**: 5 plans (complete)

Plans:
- [x] 06-01-PLAN.md - Storage helpers and post query functions
- [x] 06-02-PLAN.md - Posts API routes (save, list, detail, favorite, delete)
- [x] 06-03-PLAN.md - SavePostButton integration on main page
- [x] 06-04-PLAN.md - History list and detail pages with infinite scroll
- [x] 06-05-PLAN.md - Search and favorites functionality

#### Phase 7: Usage Limits

**Goal**: Free users are limited to daily quotas that reset automatically

**Depends on**: Phase 6 (requires post generation to count against limits)

**Requirements**: USAGE-01, USAGE-02, USAGE-03, USAGE-04, USAGE-05

**Status**: Complete (2026-02-01)

**Success Criteria** (verified):
1. Free users limited to 3 generations per day
2. Usage counter displays "X/3 used today" in UI
3. Usage resets daily at midnight in user's timezone automatically
4. Generate button hidden when daily limit reached
5. Upgrade CTA shown when limit reached with clear subscription offer

**Delivered:**
- Timezone-aware usage reset logic (@date-fns/tz TZDate)
- Usage query helpers with atomic increment (race condition protection)
- Usage API endpoints (GET status, POST increment)
- UsageCounter component with color-coded progress bar
- Countdown timer hook for reset time display
- UpgradeCTA button with €9/month pricing and benefits tooltip
- /api/generate quota enforcement (Edge->Node.js runtime migration)
- Main page conditional rendering (auth gate + limit gate)

**Plans**: 4 plans (complete)

Plans:
- [x] 07-01-PLAN.md - Usage API and query helpers (backend)
- [x] 07-02-PLAN.md - Usage counter UI component (frontend)
- [x] 07-03-PLAN.md - Upgrade CTA and generate API quota check
- [x] 07-04-PLAN.md - Main page integration

#### Phase 8: Payments

**Goal**: Users can subscribe or purchase credits to unlock unlimited generations

**Depends on**: Phase 7 (usage limits must work before monetizing)

**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08

**Success Criteria** (what must be TRUE):
1. User can subscribe via Stripe Checkout with monthly plan
2. Subscribed users have unlimited generations (no daily limit)
3. User can update payment method via Stripe Customer Portal
4. User can cancel subscription via Stripe Customer Portal
5. Stripe webhooks handle subscription events (created, canceled, failed) with idempotency
6. User can purchase credits as alternative to subscription
7. Credits deduct per generation for credit users (atomic decrement)
8. User can view current credit balance in dashboard

**Status**: Complete (2026-02-01)

**Delivered:**
- Stripe SDK setup with webhook_events schema
- Stripe API routes (checkout, portal, credits)
- Webhook handler with idempotency
- Subscription helpers and generate API integration
- Pricing page and billing UI components

Plans:
- [x] 08-01-PLAN.md — Stripe SDK setup, config, and webhook_events schema
- [x] 08-02-PLAN.md — Stripe API routes (checkout, portal, credits)
- [x] 08-03-PLAN.md — Webhook handler with idempotency
- [x] 08-04-PLAN.md — Subscription helpers and generate API integration
- [x] 08-05-PLAN.md — Pricing page and billing UI components

#### Phase 9: Dashboard & Polish

**Goal**: Users have a centralized dashboard with usage stats and UX improvements

**Depends on**: Phase 8 (dashboard shows subscription/credit status)

**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, UX-01

**Status**: Complete (2026-02-02)

**Success Criteria** (verified):
1. User sees dashboard after login with clear navigation
2. Dashboard shows usage stats (generations today, total posts saved)
3. Dashboard shows subscription or credit status clearly
4. Dashboard provides quick access to generate new post
5. Industry selector expands full list when clicking on selected industry (UX fix)

**Delivered:**
- Dashboard stats query helper with parallel Promise.all queries (lib/dashboard/queries.ts)
- StatCard component for reusable stat display (app/components/StatCard.tsx)
- Dashboard layout with navigation bar (app/dashboard/layout.tsx)
- Dashboard page with 4 stat cards and auth check (app/dashboard/page.tsx)
- Industry autocomplete click-to-reopen UX fix (app/components/IndustryAutocomplete.tsx)

**Plans**: 2 plans (complete)

Plans:
- [x] 09-01-PLAN.md — Dashboard page with stats grid and navigation
- [x] 09-02-PLAN.md — Industry selector click-to-reopen UX fix

## Progress

**Execution Order:**
Phases execute in numeric order: 4 → 5 → 6 → 7 → 8 → 9

| Phase | Milestone | Status | Completed |
|-------|-----------|--------|-----------|
| 1. Foundation | v1.0 | Complete | 2026-01-27 |
| 2. Core Generator | v1.0 | Complete | 2026-01-27 |
| 3. Image & Preview | v1.0 | Complete | 2026-01-27 |
| 4. Database Foundation | v2.0 | Complete | 2026-01-29 |
| 5. Authentication | v2.0 | Complete | 2026-01-31 |
| 6. Post History | v2.0 | Complete | 2026-01-31 |
| 7. Usage Limits | v2.0 | Complete | 2026-02-01 |
| 8. Payments | v2.0 | Complete | 2026-02-01 |
| 9. Dashboard & Polish | v2.0 | Complete | 2026-02-02 |
