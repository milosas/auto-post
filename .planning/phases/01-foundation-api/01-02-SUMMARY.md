---
phase: 01-foundation-api
plan: 02
subsystem: api
tags: [vercel-ai-sdk, edge-runtime, streaming, rate-limiting, lithuanian]

# Dependency graph
requires:
  - phase: 01-01
    provides: AI provider (kieai), rate limiter (dailyLimit), API types
provides:
  - Streaming text generation endpoint at POST /api/generate
  - Edge Runtime with 25s timeout for AI operations
  - Rate-limited API with cost protection (checks before generation)
  - Lithuanian system prompt with casual tone and CTA enforcement
affects:
  - 01-03 (Frontend will consume this streaming API)
  - Phase 2 (Image generation will follow similar streaming pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Edge Runtime for streaming AI responses (25s timeout vs 10s serverless)
    - Rate limit check before expensive operations (cost protection pattern)
    - Streaming response with metadata headers (X-RateLimit-*)
    - Lithuanian prompt engineering (casual tone, CTA requirement)

key-files:
  created:
    - app/api/generate/route.ts (Streaming generation endpoint)
  modified: []

key-decisions:
  - "Removed maxTokens parameter (not available in ai@6.0.49 streamText API)"
  - "Edge Runtime for 25s timeout (serverless has 10s limit, insufficient for generation)"
  - "Rate limit check before streamText call (cost protection order)"

patterns-established:
  - "Streaming API pattern: streamText → toTextStreamResponse with custom headers"
  - "Error response pattern: Typed errors (RateLimitError, ApiError) with Lithuanian messages"

# Metrics
duration: 14 minutes
completed: 2026-01-25
---

# Phase 1 Plan 2: API Endpoint Summary

**Streaming POST /api/generate endpoint with Edge Runtime, rate limiting before generation, and Lithuanian prompt for casual social media posts with CTAs**

## Performance

- **Duration:** 14 minutes
- **Started:** 2026-01-25T10:02:20Z
- **Completed:** 2026-01-25T10:16:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Streaming text generation endpoint with kie.ai proxy integration
- Rate limiting enforced before expensive AI operations (cost protection)
- Lithuanian system prompt with casual tone and CTA requirement
- Edge Runtime with 25s timeout for AI generation
- Comprehensive error handling with Lithuanian error messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create POST /api/generate route with streaming** - `eaa9fd2` (feat)

## Files Created/Modified

- `app/api/generate/route.ts` - POST endpoint for streaming text generation with Edge Runtime, rate limiting, and Lithuanian prompts

## Decisions Made

**1. Removed maxTokens parameter**

**Context:** Plan specified `maxTokens: 500` in streamText call, but ai@6.0.49 API doesn't accept this parameter.

**Decision:** Removed maxTokens parameter entirely. Model will use default token limits.

**Rationale:** The streamText function signature in ai@6.0.49 doesn't include maxTokens as a valid parameter (TypeScript compilation error). Token limits are handled by the model's default configuration or would need to be set in model-specific settings if needed in the future.

**Impact:** Generation will use model default token limits (typically sufficient for social media posts). Can be revisited if posts are too long.

---

**2. Edge Runtime for 25s timeout**

**Context:** Serverless functions have 10s timeout, AI generation may take longer.

**Decision:** Used Edge Runtime with `export const runtime = 'edge'` and `export const maxDuration = 25`.

**Rationale:** Vercel Edge Functions support up to 25s timeout vs 10s for serverless, providing buffer for slower AI responses.

**Impact:** Endpoint can handle longer generation times without timeout errors.

## Deviations from Plan

None - plan executed exactly as written, except for the maxTokens parameter removal which was a necessary API compatibility fix (Rule 1 - Bug fix for incorrect API usage).

## Issues Encountered

**TypeScript import path resolution:**

Initial implementation used `@/app/lib/ai` import paths, but TypeScript compilation showed errors. The tsconfig.json has `@/*` mapped to `./*` (project root), so paths like `@/app/lib/ai` correctly resolve to `./app/lib/ai` from the root. After verifying the paths matched the actual file structure, the Next.js build succeeded. This was not a bug - just needed to confirm the path configuration was correct for Next.js App Router.

## User Setup Required

**External services require manual configuration.** The following environment variables must be set before the API endpoint will work:

**Required:**

```bash
# kie.ai OpenAI Proxy
KIEAI_API_KEY=sk-xxx
KIEAI_BASE_URL=https://api.kie.ai/v1

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

**Setup instructions:**

1. kie.ai: Get API key from kie.ai dashboard
2. Upstash: Create Redis database in Upstash Console, copy REST API credentials

**Verification:**

```bash
npm run build
# Should succeed with warnings about missing env vars (expected)
# Warnings: [Upstash Redis] Unable to find environment variable...
```

## Next Phase Readiness

**Ready for 01-03 (Frontend implementation):**

- ✅ POST /api/generate endpoint exists and builds
- ✅ Streaming response pattern established
- ✅ Rate limiting integrated (X-RateLimit-* headers available)
- ✅ Error handling with typed responses (429, 400, 500)
- ⚠️ **User must set environment variables** before endpoint will actually work with AI and rate limiting

**Blockers:** None - API is ready to be consumed by frontend.

**Concerns:**

- Lithuanian language quality untested (requires actual generation with env vars set)
- Edge Runtime behavior in production untested (local dev doesn't use Edge)
- Rate limiting with anonymous IP may not work perfectly in development (localhost issue)

---

*Phase: 01-foundation-api*
*Completed: 2026-01-25*
