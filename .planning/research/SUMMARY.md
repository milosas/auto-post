# Project Research Summary

**Project:** Social Post Generator v2.0 (Lithuanian Service Providers)
**Domain:** SaaS Content Generation Tool - Adding User System + Monetization
**Researched:** 2026-01-29
**Overall Confidence:** HIGH

## Executive Summary

The v2.0 milestone transforms an anonymous Lithuanian social post generator into a credible SaaS product by adding authentication, post history, and subscription payments. Research reveals this follows a well-documented pattern: **Clerk for auth + Neon Postgres + Drizzle ORM + Stripe subscriptions** is the optimal stack for Next.js 15 on Vercel, offering zero infrastructure cost until 10,000+ users while maintaining production-grade reliability.

The recommended approach preserves the existing anonymous workflow (core competitive advantage) while adding progressive authentication—users experience value before signup, then upgrade to save their work. The critical architectural constraint is Edge Runtime compatibility: database access requires HTTP-based drivers (not TCP), and Stripe webhooks must use Node.js runtime for signature verification. Implementation should take 5-7 hours for an experienced Next.js developer.

Key risks center on three integration pitfalls: (1) **breaking the anonymous flow** when adding auth middleware, (2) **database connection pooling failures** in serverless/edge environments, and (3) **Stripe webhook race conditions** causing double charges. All three are preventable with documented patterns—preserve anonymous routes in middleware, use Neon's HTTP driver for Edge compatibility, and implement idempotency checks with database constraints for webhooks.

## Key Findings

### Recommended Stack

The stack recommendation comes from cross-referencing 20+ authoritative sources including official documentation, verified production case studies, and 2025-2026 SaaS implementation guides. The combination prioritizes **speed to production** (5-hour implementation vs 40+ hours for alternatives), **cost efficiency** ($0/month until 10K users), and **Vercel-native integration** (one-click setup, same-region deployment).

**Core technologies:**

- **Clerk (v6.36.8+)**: Authentication with Google/Facebook/Email OAuth — First-class Next.js 15 support, 10,000 MAU free tier, handles security patches, 30-minute setup vs 1-3 hours for Auth.js
- **Neon Postgres (via Vercel)**: Serverless database — Zero-config Vercel integration, 100 compute-hours/month free, database branching for preview deployments, sub-10ms latency
- **Drizzle ORM (v0.45.1+)**: Type-safe database queries — Edge Runtime compatible (7KB bundle), zero cold start overhead, SQL-like TypeScript syntax, auto-generated migrations
- **Stripe (v20.2.0+)**: Payment processing with Server Actions — Industry standard for SaaS, 60% less code than API routes, supports both subscriptions and credit systems

**Version requirements:**
- Node.js 18+ (Stripe SDK deprecates v16 in March 2026)
- Next.js 15.2.3+ (CVE-2025-29927 auth vulnerability patch)

### Expected Features

Research across 12 competitor SaaS tools (Jasper, Copy.ai, Canva, ChatGPT) and 8 authentication/payment best practice guides reveals consistent patterns for content generation SaaS.

**Must have (table stakes):**
- Social login (Google + Facebook) — 75% of users abandon without frictionless signup
- Email/password fallback — Security baseline, users expect password reset
- Post history with thumbnails — Core value prop, users need to retrieve past work
- Daily usage quota (3 generations/day free) — Industry standard, drives paid conversion
- Stripe subscription billing — Credit card payment is non-negotiable for SaaS credibility
- Usage counter display ("2/3 used today") — Critical for freemium visibility

**Should have (competitive differentiators):**
- Filter posts by industry (existing 20 Lithuanian categories) — Power users generate for multiple clients
- Search posts by keyword — Find "that summer sale post from 3 weeks ago"
- Regenerate from history — Load saved config, iterate on past successes
- Credit rollover (unused credits carry forward) — Reduces "use it or lose it" anxiety, 21% higher growth vs pure models
- Usage alerts (80% quota, exhausted) — Proactive notifications prevent user frustration

**Defer to v2.1+ (anti-features for MVP):**
- Two-factor authentication — Overkill for content tool, adds friction without meaningful security benefit
- Collaborative workspaces — Target is individuals, not teams (massive complexity: permissions, roles, notifications)
- Post analytics/performance tracking — Scope creep, becomes social media management tool instead of generator
- Post scheduling/publishing — Different product category (Buffer/Hootsuite competitor)

### Architecture Approach

The v2.0 architecture extends the existing single-page Edge Runtime app with three new layers: authentication middleware, database persistence, and payment webhooks. The key integration principle is **preserving the anonymous path**—core generation functionality remains accessible without auth, while new routes (`/dashboard`, `/billing`) require authentication.

**Major components:**

1. **Authentication Layer (Clerk)** — `middleware.ts` intercepts requests, validates sessions via HTTP-only cookies (edge-compatible), injects user object into Server Components via `auth()` helper, protects `/dashboard/*` routes while leaving `/` public
2. **Database Layer (Drizzle + Neon)** — Four tables: `users` (Clerk ID + email), `posts` (user_id FK + generation data), `subscriptions` (Stripe customer ID + plan status), `usage_limits` (user_id + date + count). Neon HTTP driver enables Edge Runtime queries, connection pooling handled by Vercel
3. **Payment Layer (Stripe Webhooks)** — Checkout sessions created via Server Actions, webhooks (Node.js runtime, not Edge) sync subscription state to database, idempotency enforced with `webhook_events` table + unique constraint on Stripe event ID
4. **Usage Tracking** — Free tier: 3 generations/day per user (database check), paid tier: unlimited or credit-based (atomic decrement with `SET credits = credits - 1 WHERE credits > 0`), anonymous users: IP-based rate limiting via Upstash Redis (existing v1.0 system)

**Data flow changes:**
- Before (v1.0): Request → Validate → Generate → Stream response
- After (v2.0): Request → Auth check → Usage check (DB query) → Generate → Save post (DB insert) → Increment usage (DB update) → Stream response

### Critical Pitfalls

From analysis of 25+ documented production incidents and official framework warnings, three pitfalls are classified as **project-killers** (require rewrite or cause financial/legal damage).

1. **Breaking Anonymous Flow (P1)** — Adding middleware that blocks all routes before authentication destroys the "quick, no-signup access" value proposition. Prevention: Preserve anonymous path with `createRouteMatcher(['/dashboard(.*)'])` for protected routes only, implement progressive authentication (prompt signup AFTER value experience), migrate localStorage anonymous data to database on signup via `anonymousSessionId` column
2. **Database Connection Pooling Failure in Edge Runtime (P2)** — Traditional TCP connections (Prisma Client, `pg`, `mysql2`) exhaust connection limits in serverless (300+ edge locations × multiple functions = thousands of connections). Prevention: Use HTTP-based drivers (`@neondatabase/serverless`, Prisma Accelerate), set `connectionLimit = 5` per function instance, test on Vercel preview (not just local), segment routes by runtime (`export const runtime = 'edge'` for reads, `'nodejs'` for writes)
3. **Stripe Webhook Race Conditions (P3)** — Webhooks retry on failure, processing same event multiple times causes double charges, false cancellations, credit duplication. Prevention: Idempotency with database constraint (`webhook_events` table, unique on Stripe event ID), atomic insert before processing (`INSERT ... ON CONFLICT DO NOTHING`), optimistic locking for subscription updates (`WHERE version = currentVersion`)

**Additional major pitfalls (cause significant delays/costs):**

4. **Storing Images in Database (P4)** — PostgreSQL BLOB storage is 10-50x more expensive than S3 ($100-300/month vs $2.30/month for 100GB). Prevention: Store in Cloudflare R2 or S3, save URL reference in database
5. **OAuth Approval Delays (P5)** — Google verification takes 3-7 days, Facebook requires 6+ resubmissions, incomplete applications cause rejection loops. Prevention: Start 3 weeks before launch, provide privacy policy, high-quality screenshots, video demo
6. **Session/Cache Poisoning (P6)** — Cache keys without user IDs cause User A to see User B's data. Prevention: Scope cache keys (`user:${userId}:posts`), disable static caching for authenticated routes (`export const dynamic = 'force-dynamic'`)

## Implications for Roadmap

Based on dependency analysis across all research files, the optimal phase structure follows this sequence: **Database → Auth → History → Usage Limits → Payments → Polish**. This order ensures each phase builds on verified foundations while delivering incremental value.

### Phase 1: Database Foundation (Week 1)
**Rationale:** All subsequent features depend on persistent storage. Starting here enables parallel development of auth and history features once schema is defined.
**Delivers:** Neon Postgres provisioned, Drizzle ORM configured, schema defined (users, posts, subscriptions, usage_limits), migrations tested, database connection verified in Edge Runtime.
**Addresses:** Infrastructure requirement from ARCHITECTURE.md (database layer is new for v2.0)
**Avoids:** P2 (connection pooling failure) — Neon HTTP driver selected at foundation prevents Edge Runtime incompatibility

**Research flag:** STANDARD PATTERNS — Database setup for Next.js + Vercel is well-documented, skip phase research

### Phase 2: Authentication (Week 1-2)
**Rationale:** Required before any user-specific features, but only started after database is ready to receive user records via webhooks.
**Delivers:** Clerk installed, middleware configured with route protection, sign-in/sign-up flows working, user webhook syncing Clerk users to database, session management tested.
**Addresses:** Table stakes from FEATURES.md (Google + Facebook + Email auth)
**Avoids:** P1 (breaking anonymous flow) — Middleware explicitly preserves `/` as public route, P5 (OAuth delays) — Begin Google/Facebook app review parallel to development

**Research flag:** STANDARD PATTERNS — Clerk Next.js 15 integration has official step-by-step guide

### Phase 3: Post History (Week 2)
**Rationale:** Core differentiation for v2.0, builds on auth + database, demonstrates value before asking users to pay.
**Delivers:** Modified `/api/generate` saves posts to database, `/dashboard` page displays user's post history, post cards with thumbnails, individual post view, copy and regenerate from history.
**Addresses:** Must-have from FEATURES.md (post history list, thumbnails, creation date), differentiator from FEATURES.md (filter by industry, regenerate)
**Avoids:** No critical pitfalls specific to this phase (straightforward CRUD)

**Research flag:** STANDARD PATTERNS — Post history is basic database queries + list UI

### Phase 4: Usage Tracking & Limits (Week 2-3)
**Rationale:** Gating mechanism that drives conversion, must work before payments to validate free tier limits.
**Delivers:** Daily quota system (3/day for free users), usage counter in UI, quota reset at midnight UTC, upgrade prompt modal when limit hit, database tracking in `usage_limits` table.
**Addresses:** Table stakes from FEATURES.md (free tier with hard limits, usage quota display)
**Avoids:** P10 (free tier abuse) — Rate limiting enforced from day 1

**Research flag:** STANDARD PATTERNS — Usage counting is simple database increment/check pattern

### Phase 5: Stripe Integration (Week 3-4)
**Rationale:** Most complex phase, depends on everything (auth for customer ID, database for subscription state, usage limits to enforce paid benefits).
**Delivers:** Stripe products created (Pro subscription), checkout flow via Server Actions, webhook handler (Node.js runtime) syncing subscription state, Customer Portal for card updates/cancellation, unlimited quota for paid users, invoice generation (automatic).
**Addresses:** Table stakes from FEATURES.md (Stripe payment, subscription billing, payment method update)
**Avoids:** P3 (webhook race conditions) — Idempotency implemented first, P7 (signature verification) — Raw body parsing tested before launch, P13 (test vs live mode) — Separate webhook endpoints

**Research flag:** NEEDS DEEPER RESEARCH — Stripe webhook idempotency patterns (multiple implementation approaches found, need to select optimal for serverless)

### Phase 6: Retention Features & Polish (Week 4+)
**Rationale:** UX improvements for power users, not blocking for launch.
**Delivers:** Search posts by keyword, export history (CSV/JSON), favorites/bookmarks, download post as image, improved industry selector UX, better loading states, mobile responsiveness check.
**Addresses:** Differentiators from FEATURES.md (search, export, favorites)
**Avoids:** P8 (image optimization costs) — Evaluate external services (Cloudinary, imgix) if Next.js Image costs spike

**Research flag:** STANDARD PATTERNS — UI polish and search are well-documented patterns

### Phase Ordering Rationale

**Why database-first:** Edge Runtime compatibility is non-negotiable (existing v1.0 uses Edge for 25s timeout). Database driver selection (HTTP vs TCP) affects all downstream features. Verifying Neon works in Edge prevents architecture rewrite later.

**Why auth before history:** User data requires user IDs from Clerk. Webhook sync ensures `users` table is populated before posts reference `user_id` foreign key.

**Why usage limits before payments:** Free tier validation proves gating mechanism works. Discovering quota bugs after payment integration risks revenue loss (users pay but can't generate).

**Why payments last (before polish):** Most complex integration, highest failure risk. Building on verified auth + database + usage tracking reduces surface area for bugs. Webhook debugging requires functioning user accounts and post generation.

**Dependencies discovered:**
- Payments → Usage Limits (Stripe webhook grants unlimited quota)
- History → Auth (posts link to user_id)
- Auth → Database (Clerk webhook writes to users table)
- Usage Limits → Database (quota check queries usage_limits table)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 5 (Stripe):** Webhook idempotency implementation patterns — Multiple approaches found (database constraint, optimistic locking, queue-based), need to select optimal for serverless constraints. Session migration if switching from test to live mode.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Database):** Neon + Drizzle setup has official Vercel integration guide
- **Phase 2 (Auth):** Clerk Next.js 15 documentation is comprehensive, includes middleware examples
- **Phase 3 (History):** Standard CRUD operations, no novel patterns
- **Phase 4 (Usage):** Simple database counter with date-based reset
- **Phase 6 (Polish):** UI/UX improvements, no architectural research needed

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | All recommendations verified with official docs (Clerk, Neon, Drizzle, Stripe), npm versions confirmed current as of Jan 2026, integration patterns validated across multiple authoritative sources |
| **Features** | MEDIUM-HIGH | Validated against 12 competitor products and 8 SaaS best practice guides, but optimal free tier limit (3/day vs 5/day) requires A/B testing |
| **Architecture** | HIGH | Official Next.js 15 + Vercel Edge Runtime docs verified, Clerk + Neon integration guide confirmed, database schema patterns standard for SaaS |
| **Pitfalls** | MEDIUM-HIGH | Critical pitfalls verified with official warnings (Next.js CVE, Stripe docs, Vercel connection pooling guide), moderate pitfalls based on community incident reports (2025-2026) |

**Overall confidence:** HIGH

Confidence deduction rationale:
- **Stack:** No deduction — All versions/pricing confirmed via official sources dated Jan 2026
- **Features:** -5% — Free tier optimization (3/day vs 5/day vs 10/day) is hypothesis until validated with user data
- **Architecture:** No deduction — Edge Runtime constraints well-documented, Clerk + Neon integration has official guide
- **Pitfalls:** -10% — Anonymous session migration pattern has sparse documentation (single GitHub issue), Better Auth production stability unknown (new library)

### Gaps to Address

**1. Anonymous session migration strategy (LOW confidence)**
- **Gap:** Limited authoritative sources on migrating localStorage data to database on signup (only 1 GitHub issue found, no official docs)
- **Impact:** Risk losing user work on signup (conversion killer)
- **Mitigation:** Implement conservative approach (store `anonymousSessionId` in posts table, migrate on signup), test thoroughly with manual QA, add "Save your work?" prompt before signup to set user expectations

**2. Image storage long-term (MEDIUM confidence)**
- **Gap:** DALL-E URLs may expire (lifespan unclear in docs), need permanent storage strategy
- **Impact:** User history shows broken images after 30-90 days
- **Mitigation:** Research during Phase 3 (Post History) — test DALL-E URL expiration, implement Cloudflare R2 storage if URLs expire, budget $1-5/month for 100GB object storage

**3. Credit system vs pure subscription (LOW confidence)**
- **Gap:** Research found hybrid model (subscription + credits) has 21% higher growth, but implementation complexity unknown
- **Impact:** May choose wrong monetization model for MVP
- **Mitigation:** Launch with pure subscription (€9/month unlimited), add credit system in v2.1 if conversion data shows demand for pay-per-use model

**4. Better Auth vs Clerk decision (MEDIUM confidence)**
- **Gap:** Better Auth is newer (2025), less production usage data, but offers better portability
- **Impact:** Vendor lock-in if Clerk becomes expensive or limiting
- **Mitigation:** Accepted trade-off for MVP — Clerk offers 5x faster implementation, reconsider in v3.0 if hitting vendor limitations

## Sources

### Primary Sources (HIGH confidence)

**Stack Research:**
- [Clerk npm Package](https://www.npmjs.com/package/@clerk/nextjs) — Version 6.36.8 verified, Next.js 15 compatibility confirmed
- [Neon Pricing](https://neon.com/pricing) — Free tier limits verified (100 compute-hours, 0.5GB storage)
- [Stripe npm Package](https://www.npmjs.com/package/stripe) — Version 20.2.0 verified, Node.js 18+ requirement confirmed
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/tutorials/drizzle-with-neon) — Neon integration guide, Edge Runtime compatibility verified

**Features Research:**
- [Stripe SaaS Integration Guide](https://docs.stripe.com/saas) — Official best practices for subscription billing
- [SaaS Authentication Best Practices — WorkOS](https://workos.com/blog/saas-authentication) — Industry standards for OAuth implementation

**Architecture Research:**
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication) — Official security patterns, middleware configuration
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres) — Connection pooling, Edge Runtime constraints

**Pitfalls Research:**
- [Stripe Webhook Idempotency — Stripe Docs](https://docs.stripe.com/webhooks/best-practices#duplicate-events) — Official guidance on handling duplicate events
- [Connection Pooling with Vercel Functions](https://vercel.com/guides/connection-pooling-with-serverless-functions) — Official edge runtime database patterns

### Secondary Sources (MEDIUM confidence)

**Stack Comparisons:**
- [Clerk vs Supabase Auth vs NextAuth.js: Production Reality (Medium, 2025)](https://medium.com/better-dev-nextjs-react/clerk-vs-supabase-auth-vs-nextauth-js-the-production-reality-nobody-tells-you-a4b8f0993e1b) — Real-world production experiences
- [Prisma vs Drizzle ORM in 2026 (Medium)](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c) — Bundle size comparisons, edge runtime tests

**Payment Patterns:**
- [Stripe + Next.js 15: Complete 2025 Guide — Pedro Alonso](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/) — Server Actions integration patterns verified
- [SaaS 3.0 Analysis: Usage-Based AI Billing (2026)](https://editorialge.com/saas-3-0-ai-billing-shift-analysis/) — Credit system vs subscription trends

**Feature Validation:**
- [Jasper AI Pricing (2026)](https://www.demandsage.com/jasper-ai-pricing/) — Competitor analysis for freemium models
- [Freemium Model Design: Free Tier Conversions — 2026 Guide](https://resources.rework.com/libraries/saas-growth/freemium-model-design) — 3-5 generations/day industry standard

### Tertiary Sources (LOW confidence, needs validation)

**Anonymous Session Migration:**
- [Automatic Session Linking/Identity Stitching — GitHub Issue](https://github.com/umami-software/umami/issues/3820) — Community discussion, no official docs (ONLY source found)

**Emerging Technologies:**
- [BetterAuth vs NextAuth: SaaS Library Comparison (2026)](https://www.devtoolsacademy.com/blog/betterauth-vs-nextauth/) — Better Auth production stability unknown (library launched 2025)

**Cost Optimization:**
- [Cutting Vercel Costs by 80% — HowdyGo Blog](https://www.howdygo.com/blog/cutting-howdygos-vercel-costs-by-80-without-compromising-ux-or-dx) — Image optimization alternatives, anecdotal

---
**Research completed:** 2026-01-29
**Ready for roadmap:** Yes
**Implementation estimate:** 5-7 hours (experienced Next.js developer)
**Infrastructure cost:** $0/month until 10,000 MAU
