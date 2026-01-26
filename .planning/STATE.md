# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-25)

**Core value:** Users can generate a professional, industry-appropriate social media post in under 60 seconds without any account creation or complex setup.
**Current focus:** Phase 3: Image & Preview

## Current Position

Phase: 3 of 3 (Image & Preview)
Plan: 2 of 3 complete
Status: In progress
Last activity: 2026-01-26 — Completed 03-01-PLAN.md

Progress: [████████░░] 89%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 9.8 minutes
- Total execution time: 1.31 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 - Foundation & API | 3/3 | 29 min | 9.7 min |
| 2 - Core Generator | 3/3 | 40 min | 13.3 min |
| 3 - Image & Preview | 2/3 | 7 min | 3.5 min |

**Recent Trend:**
- Last 5 plans: 02-02 (13m), 02-03 (15m), 03-02 (3m), 03-01 (4m)
- Trend: Excellent velocity on Phase 3

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All phases: DALL-E 3 over Flux (same OpenAI API, simpler integration)
- All phases: Skip image crop for MVP (users can crop before upload)
- Phase 1: Direct OpenAI for text generation (simpler setup, kie.ai reserved for image gen Phase 3)
- Phase 2: No routing (SPA with single flow)
- Phase 1-3: Vercel serverless (free tier, simple deployment, API routes built-in)
- 01-01: @ai-sdk/openai-compatible for custom baseURL (kie.ai proxy support)
- 01-01: Sliding window rate limit over fixed window (prevents burst abuse)
- 01-01: Singleton rate limiter pattern (connection caching in serverless)
- 01-02: Edge Runtime for 25s timeout (serverless 10s insufficient for AI generation)
- 01-02: Rate limit check before streamText call (cost protection order)
- 01-03: Switched from kie.ai to direct OpenAI for text generation (simplicity)
- 01-03: Rate limiting made optional (graceful degradation when Redis not configured)
- 02-01: Fuse.js threshold 0.3 for typo-tolerant search (balances accuracy and fuzziness)
- 02-01: SSR-safe localStorage hook pattern (prevents hydration errors)
- 02-02: Button-style options instead of native selects (better mobile UX)
- 02-02: Bottom-center toast position with 2s duration (non-intrusive feedback)
- 02-02: Lithuanian html lang attribute (accessibility and SEO)
- 02-03: StreamingDisplay with 4 states and blinking cursor (visual streaming feedback)
- 02-03: Sticky bottom ActionButtons with z-50 (mobile thumb accessibility)
- 02-03: 20 Lithuanian industry categories (expanded based on user feedback)
- 02-03: Industry persistence with useLocalStorage (returning user convenience)
- 03-01: English prompts for DALL-E (better results per RESEARCH.md)
- 03-01: Direct OpenAI client for images.generate (not in @ai-sdk/openai)
- 03-01: 5MB file size limit for uploads
- 03-01: Standard quality default for DALL-E (HD optional)
- 03-01: Natural style for DALL-E (professional social media aesthetic)
- 03-02: Tab-style toggle for mobile/desktop switching (matches PostConfiguration pattern)
- 03-02: Simplified mock preview style with minimal headers (legal-safe, recognizable)
- 03-02: Generic neutral colors avoiding exact platform branding (legal consideration)
- 03-02: forwardRef pattern for future html-to-image export support
- 03-02: Platform-specific layouts (Facebook text-first, Instagram image-first square crop)

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1:** COMPLETE
- ~~Lithuanian language quality needs validation~~ RESOLVED - Human-verified natural and industry-appropriate
- ~~API cost monitoring essential from day one~~ RESOLVED - Rate limiting enforced (50/24h)
- ~~Vercel timeout limits~~ RESOLVED - Using Edge Runtime with 25s timeout
- ~~Environment variables needed~~ RESOLVED - Optional rate limiting, only OPENAI_API_KEY required
- Next.js 15.1.4 security vulnerability exists (npm warning) - consider upgrading
- Edge Runtime behavior in production untested (local dev doesn't use Edge)
- Rate limiting with anonymous IP may not work perfectly in development (localhost issue)

**Phase 2:** COMPLETE
- Plan 02-01 complete - industry autocomplete with 20 categories and fuzzy search
- Plan 02-02 complete - post configuration UI and toast system
- Plan 02-03 complete - main page assembly with streaming display and action buttons
- All success criteria met: 60-second workflow from land to copy functional

**Phase 3:** IN PROGRESS
- Plan 03-01 complete - image upload with react-dropzone, DALL-E generation endpoint
- Plan 03-02 complete - social preview components (Facebook, Instagram) with mobile/desktop toggle
- DALL-E content policy behavior with Lithuanian prompts unpredictable (deferred to v2)
- OPENAI_API_KEY required for image generation (upload works independently)

## Session Continuity

Last session: 2026-01-26
Stopped at: Completed 03-01-PLAN.md
Resume file: None

Config:
model_profile: balanced
commit_docs: true
