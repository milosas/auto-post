---
phase: 01-foundation-api
plan: 01
subsystem: infrastructure
tags: [nextjs, ai-sdk, rate-limiting, typescript, upstash]
requires: []
provides:
  - Next.js 15 App Router project structure
  - AI SDK configuration for kie.ai proxy
  - Rate limiting infrastructure (50/24h)
  - TypeScript types for API contracts
affects:
  - 01-02 (API endpoint will import kieai provider and dailyLimit)
  - 01-03 (Frontend will use API types)
tech-stack:
  added:
    - ai@6.0.49 (Vercel AI SDK)
    - @ai-sdk/openai-compatible@2.0.18 (Custom provider support)
    - @upstash/ratelimit@2.0.8 (Serverless rate limiting)
    - @upstash/redis@1.36.1 (Redis client)
    - next@15.1.4 (App Router framework)
    - tailwindcss@3.4.1 (Styling)
  patterns:
    - Singleton pattern for rate limiter (connection caching)
    - Environment-based configuration (Redis.fromEnv())
    - OpenAI-compatible provider pattern for AI proxy
key-files:
  created:
    - package.json (Project dependencies)
    - app/lib/ai.ts (kieai provider export)
    - app/lib/rate-limit.ts (dailyLimit export)
    - app/types/api.ts (API request/response types)
    - .env.example (Environment variable documentation)
  modified:
    - .gitignore (Added .next/, out/)
decisions:
  - id: use-openai-compatible-sdk
    choice: "@ai-sdk/openai-compatible instead of @ai-sdk/openai"
    rationale: "Enables custom baseURL for kie.ai proxy"
    alternatives: "Direct OpenAI SDK would hardcode api.openai.com endpoint"
  - id: sliding-window-rate-limit
    choice: "50 requests per 24h sliding window"
    rationale: "Prevents cost runaway while allowing normal usage"
    alternatives: "Fixed window would allow burst abuse at window boundaries"
  - id: singleton-rate-limiter
    choice: "Instantiate Ratelimit outside request handler"
    rationale: "Enables Redis connection caching in serverless environment"
    alternatives: "Per-request instantiation causes connection overhead"
metrics:
  duration: "7 minutes"
  completed: "2026-01-25"
---

# Phase 1 Plan 1: Foundation Setup Summary

**One-liner:** Next.js 15 project with AI SDK (kie.ai proxy), Upstash rate limiting (50/24h), and TypeScript API types.

## What Was Built

Initialized the foundational Next.js 15 App Router project with all infrastructure needed for the API endpoint:

1. **Next.js 15 Project** - App Router with TypeScript, Tailwind CSS, ESLint
2. **AI Provider** - Configured kie.ai proxy using @ai-sdk/openai-compatible for custom base URL
3. **Rate Limiting** - Upstash Redis-based rate limiter with 50/24h sliding window
4. **Type Safety** - Comprehensive TypeScript interfaces for API requests and responses

## Tasks Completed

| Task | Name                                          | Commit  | Files Modified                                    |
| ---- | --------------------------------------------- | ------- | ------------------------------------------------- |
| 1    | Initialize Next.js 15 project with deps       | 5dfc820 | package.json, tsconfig.json, next.config.js, app/ |
| 2    | Create AI provider and rate limiter libraries | 78aa2ec | app/lib/ai.ts, app/lib/rate-limit.ts, .env.example |
| 3    | Create TypeScript types for API               | e386b26 | app/types/api.ts                                  |

## Architecture Decisions

### Use OpenAI-Compatible SDK

**Decision:** Use `@ai-sdk/openai-compatible` instead of `@ai-sdk/openai`

**Context:** Need to route requests through kie.ai proxy (user's existing cost-controlled setup) instead of directly to OpenAI.

**Implementation:**
```typescript
export const kieai = createOpenAICompatible({
  name: 'kieai',
  apiKey: process.env.KIEAI_API_KEY!,
  baseURL: process.env.KIEAI_BASE_URL!,
});
```

**Impact:** API endpoint can use kie.ai with the same interface as OpenAI SDK.

### Sliding Window Rate Limiting

**Decision:** 50 requests per 24 hours using sliding window algorithm

**Context:** Need to prevent cost runaway from abuse while allowing legitimate usage patterns.

**Why sliding window:** Fixed windows allow burst abuse at boundaries (e.g., 50 requests at 11:59 PM, another 50 at 12:01 AM). Sliding window smooths the limit across time.

**Implementation:**
```typescript
export const dailyLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, '24 h'),
  analytics: true,
  prefix: 'ratelimit:daily',
});
```

**Impact:** Provides fair rate limiting without exploitable edge cases.

### Singleton Rate Limiter Pattern

**Decision:** Instantiate `Ratelimit` outside request handler

**Context:** Serverless functions benefit from connection caching between invocations.

**Why singleton:** Next.js keeps module-level variables warm across requests in the same container. Instantiating inside handler would create new Redis connections on every request.

**Impact:** Reduces latency and connection overhead in production.

## Dependencies Added

**Production:**
- `ai@6.0.49` - Vercel AI SDK core
- `@ai-sdk/openai-compatible@2.0.18` - Custom provider support
- `@upstash/ratelimit@2.0.8` - Serverless rate limiting
- `@upstash/redis@1.36.1` - Redis client for Vercel/serverless
- `next@15.1.4` - React App Router framework
- `react@19.0.0` + `react-dom@19.0.0`

**Development:**
- `typescript@5` - Type safety
- `tailwindcss@3.4.1` - Utility-first CSS
- `eslint@8` + `eslint-config-next` - Linting
- `autoprefixer@10.4.23` - CSS vendor prefixes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added autoprefixer dependency**

- **Found during:** Task 1 verification (first `npm run build`)
- **Issue:** Build failed with "Cannot find module 'autoprefixer'" - postcss.config.mjs referenced it but package.json didn't include it
- **Fix:** Ran `npm install -D autoprefixer`
- **Files modified:** package.json, package-lock.json
- **Commit:** Included in Task 1 commit (5dfc820)

**2. [Rule 3 - Blocking] Created Next.js project manually**

- **Found during:** Task 1 execution
- **Issue:** `create-next-app` failed due to directory name containing spaces ("post kurimas web app" violates npm naming restrictions)
- **Fix:** Created all Next.js config files manually (package.json, tsconfig.json, next.config.js, etc.) instead of using CLI wizard
- **Files modified:** All Task 1 files
- **Commit:** Task 1 (5dfc820)
- **Rationale:** Directory already existed with git initialized and planning artifacts; renaming would break project context

## Type Exports

The following types are now available for import across the project:

**From `app/types/api.ts`:**
- `GenerateRequest` - POST /api/generate request body
- `GenerateResponse` - Successful generation response
- `RateLimitError` - 429 rate limit exceeded response
- `ApiError` - General API error response

**From `app/lib/ai.ts`:**
- `kieai` - Configured AI provider instance

**From `app/lib/rate-limit.ts`:**
- `dailyLimit` - Rate limiter singleton (50/24h)

## Environment Variables Required

Documented in `.env.example`:

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

## Verification Results

All success criteria met:

- ✅ Next.js 15 project builds successfully (`npm run build` passes)
- ✅ No ESLint errors (`npm run lint` passes)
- ✅ All dependencies installed: ai, @ai-sdk/openai-compatible, @upstash/ratelimit, @upstash/redis
- ✅ lib/ai.ts exports kieai provider configured for custom base URL
- ✅ lib/rate-limit.ts exports dailyLimit with 50/24h sliding window
- ✅ types/api.ts exports GenerateRequest, GenerateResponse, RateLimitError, ApiError
- ✅ .env.example documents all required environment variables

## Next Phase Readiness

**Ready for 01-02 (API Endpoint):**
- ✅ kieai provider available for import
- ✅ dailyLimit rate limiter available for import
- ✅ API types defined for request validation and error responses
- ⚠️ **User must set up environment variables** before API endpoint will work:
  - KIEAI_API_KEY and KIEAI_BASE_URL (from kie.ai)
  - UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (from Upstash)

**Blockers:** None - infrastructure is ready, just needs credentials.

**Concerns:**
- Next.js 15.1.4 has a security vulnerability (npm warned during install) - consider upgrading to patched version
- LF/CRLF line ending warnings during git operations (Windows environment) - not blocking but may cause diffs
