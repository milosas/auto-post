# Social Post Generator

## Current State

**Shipped:** v2.0 User System + Monetization (2026-02-02)

**What v2.0 delivered:**
- Supabase Auth with Google OAuth, email/password, and magic link authentication
- Drizzle ORM database layer (users, posts, subscriptions, usage_limits)
- Post history with infinite scroll, search, favorites, and regenerate
- Timezone-aware usage limits (3/day free tier) with automatic reset
- Stripe payments with 3 subscription tiers and credit packages
- User dashboard with stats grid and navigation
- Code cleanup addressing all identified tech debt

**Stats:**
- 118 files, 7,665 LOC TypeScript
- 35/35 requirements satisfied (100%)
- 7 phases, 23 plans completed

## Next Milestone Goals

**Planned:** v2.1 (TBD)

Potential features from Future Requirements:
- Facebook OAuth (AUTH-10)
- Account deletion with GDPR compliance (AUTH-11)
- Filter posts by industry/date range (HIST-09, HIST-10)
- Annual billing with discount (PAY-09)

---

<details>
<summary>v1.0 Baseline (Shipped 2026-01-27)</summary>

**What v1 delivered:**
- AI-powered post generator for Lithuanian service providers
- 20 industry categories with fuzzy autocomplete
- Streaming text generation with visual feedback
- Image upload (drag-drop) and DALL-E AI generation
- Facebook/Instagram social preview
- Multi-format download (PNG/JPEG)
- Complete 60-second workflow from landing to download

</details>

## What This Is

A fast, simple tool for small service providers (beauty specialists, trainers, physiotherapists, massage therapists) to create professional Facebook/Instagram posts with AI assistance. Users select their industry, upload or generate an image, configure post settings, and get AI-generated Lithuanian text ready to copy and use.

## Core Value

Users can generate a professional, industry-appropriate social media post in under 60 seconds with full SaaS features (auth, history, payments).

## Requirements

### Validated

**v1.0:**
- Industry selection with 20 Lithuanian categories
- Image upload (JPG/PNG/WebP, max 5MB) with drag & drop
- AI image generation via DALL-E with "generate from text"
- Post configuration (topic, tone, emoji, length)
- Streaming text generation in Lithuanian
- One-click copy with toast confirmation
- Regenerate text functionality
- Facebook/Instagram mock preview
- Mobile/desktop preview toggle
- Responsive mobile-first design
- Loading states during AI generation
- Toast notifications for actions
- Secured API keys (server-side only)
- Rate limiting for cost protection

**v2.0:**
- Industry selector expands on click (UX fix)
- Google OAuth authentication
- Email/password authentication
- Magic link authentication
- User dashboard with stats
- Post history with search and favorites
- Supabase Storage for images
- Stripe subscription payments
- Stripe credits system
- Free tier with 3 generations/day limit

### Active

(Next milestone requirements will be defined via `/gsd:new-milestone`)

### Out of Scope

- Post scheduling — users copy/paste manually
- Direct posting to social media — requires OAuth complexity
- Analytics / tracking — not needed for current scope
- Templates library — deferred
- Multi-language beyond Lithuanian — LT only for now
- Team collaboration — single-user tool
- Image crop functionality — upload as-is
- Two-factor authentication (2FA) — overkill for content tool
- Enterprise SSO (SAML) — target is SMBs
- Lifetime deals — unsustainable for MRR

## Context

**Shipped:** v2.0 with 7,665 LOC TypeScript across 118 files.

**Tech stack:**
- Next.js 15 with Node.js runtime
- Supabase Auth + Postgres
- Drizzle ORM with postgres.js
- OpenAI API for streaming text generation
- DALL-E 3 for AI image generation
- Stripe for payments (subscriptions + credits)
- Supabase Storage for image persistence
- Fuse.js for industry autocomplete
- html-to-image for preview export
- react-dropzone for image upload
- react-hot-toast for notifications
- @date-fns/tz for timezone handling

**Target Users:** Lithuanian small service providers who need to post regularly on social media but struggle with content creation. They're busy professionals, not marketers.

## Constraints

- **API:** OpenAI direct API for text generation
- **Deployment:** Vercel with Node.js runtime
- **Language:** Lithuanian only
- **Image Size:** Max 5MB uploads
- **Auth:** Supabase Auth with Google OAuth

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Direct OpenAI for text generation | Simpler setup than proxy | Good |
| Node.js Runtime (changed from Edge) | Supabase session handling | Good |
| Optional rate limiting | Graceful degradation in dev | Good |
| DALL-E 3 over Flux | Same OpenAI API, simpler integration | Good |
| Supabase Auth over Clerk | Unified with existing Supabase DB | Good |
| Cursor-based pagination | Stable pagination, better performance | Good |
| Timezone-aware usage limits | Better UX, users think in local time | Good |
| Atomic credit deduction | Prevents race conditions | Good |
| Fuse.js for autocomplete | Typo-tolerant industry search | Good |
| html-to-image for export | DOM to PNG/JPEG conversion | Good |
| 20 industry categories | Broad coverage per user feedback | Good |

## Tech Debt

Tracked for future cleanup:

- **OUT-03:** Inline text editing not implemented — user must regenerate entire post
- **.env.example:** References KIEAI_API_KEY but implementation uses OPENAI_API_KEY
- **Duplicate CSS:** ActionButtons has both fixed positioning and is wrapped in fixed div
- **Image optimization:** Using `<img>` instead of `next/image`

---
*Last updated: 2026-02-02 after v2.0 milestone completion*
