# Roadmap: Social Post Generator v2.0

## Overview

Transform the anonymous v1 MVP into a credible SaaS product by adding authentication (Clerk), database persistence (Neon Postgres + Drizzle), post history, usage-based monetization (Stripe), and a user dashboard. The roadmap preserves the existing anonymous workflow while adding progressive authentication—users experience value before signup, then upgrade to save their work. Phases follow natural dependencies: Database → Auth → History → Usage Limits → Payments → Dashboard.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-3 (shipped 2026-01-27)
- 🚧 **v2.0 User System + Monetization** - Phases 4-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-3) - SHIPPED 2026-01-27</summary>

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

### 🚧 v2.0 User System + Monetization (In Progress)

**Milestone Goal:** Transform anonymous tool into SaaS with user accounts, post history, and Stripe payments.

#### Phase 4: Database Foundation

**Goal**: Establish database infrastructure for all user-specific features

**Depends on**: Phase 3 (v1 shipped)

**Requirements**: Database schema design (not explicitly in REQUIREMENTS.md, foundational work)

**Success Criteria** (what must be TRUE):
1. Neon Postgres database provisioned and connected to Vercel project
2. Drizzle ORM configured with Edge Runtime compatibility verified
3. Database schema defined for users, posts, subscriptions, and usage_limits tables
4. Database migrations run successfully in development and preview environments
5. Database queries work from Edge Runtime API routes (HTTP driver verified)

**Plans**: TBD

Plans:
- [ ] 04-01: TBD during planning

#### Phase 5: Authentication

**Goal**: Users can securely create accounts and authenticate across sessions

**Depends on**: Phase 4 (database must exist to store user records)

**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09

**Success Criteria** (what must be TRUE):
1. User can sign up with Google OAuth or email/password
2. User can log in with Google OAuth, email/password, or magic link (passwordless)
3. User receives email verification after signup
4. User can reset password via email link
5. User session persists across browser refresh without re-login
6. User can log out from any page
7. Anonymous users can still access generation workflow without authentication
8. Clerk user data syncs to database users table via webhooks

**Plans**: TBD

Plans:
- [ ] 05-01: TBD during planning

#### Phase 6: Post History

**Goal**: Users can save, view, and manage their generated posts

**Depends on**: Phase 5 (requires authenticated users with user_id)

**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04, HIST-05, HIST-06, HIST-07, HIST-08

**Success Criteria** (what must be TRUE):
1. Generated posts automatically save to database with text, image URL, and generation config
2. User can view list of saved posts with date, thumbnail, and text preview
3. User can view individual post details with full text and image
4. User can copy text from saved post with one click
5. User can regenerate post from saved configuration
6. User can search posts by text content
7. User can mark posts as favorites and view favorites separately

**Plans**: TBD

Plans:
- [ ] 06-01: TBD during planning

#### Phase 7: Usage Limits

**Goal**: Free users are limited to daily quotas that reset automatically

**Depends on**: Phase 6 (requires post generation to count against limits)

**Requirements**: USAGE-01, USAGE-02, USAGE-03, USAGE-04, USAGE-05

**Success Criteria** (what must be TRUE):
1. Free users limited to 3 generations per day
2. Usage counter displays "X/3 used today" in UI
3. Usage resets daily at midnight UTC automatically
4. Generate button disabled when daily limit reached
5. Upgrade prompt modal shown when limit reached with clear subscription offer

**Plans**: TBD

Plans:
- [ ] 07-01: TBD during planning

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

**Plans**: TBD

Plans:
- [ ] 08-01: TBD during planning

#### Phase 9: Dashboard & Polish

**Goal**: Users have a centralized dashboard with usage stats and UX improvements

**Depends on**: Phase 8 (dashboard shows subscription/credit status)

**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, UX-01

**Success Criteria** (what must be TRUE):
1. User sees dashboard after login with clear navigation
2. Dashboard shows usage stats (generations today, total posts saved)
3. Dashboard shows subscription or credit status clearly
4. Dashboard provides quick access to generate new post
5. Industry selector expands full list when clicking on selected industry (UX fix)

**Plans**: TBD

Plans:
- [ ] 09-01: TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 4 → 5 → 6 → 7 → 8 → 9

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-01-27 |
| 2. Core Generator | v1.0 | 2/2 | Complete | 2026-01-27 |
| 3. Image & Preview | v1.0 | 3/3 | Complete | 2026-01-27 |
| 4. Database Foundation | v2.0 | 0/TBD | Not started | - |
| 5. Authentication | v2.0 | 0/TBD | Not started | - |
| 6. Post History | v2.0 | 0/TBD | Not started | - |
| 7. Usage Limits | v2.0 | 0/TBD | Not started | - |
| 8. Payments | v2.0 | 0/TBD | Not started | - |
| 9. Dashboard & Polish | v2.0 | 0/TBD | Not started | - |
