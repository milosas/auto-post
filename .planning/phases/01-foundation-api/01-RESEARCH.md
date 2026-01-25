# Phase 1: Foundation & API - Research

**Researched:** 2026-01-25
**Domain:** Next.js 15 App Router API with OpenAI streaming and rate limiting
**Confidence:** HIGH

## Summary

This phase requires implementing secure OpenAI API integration with streaming responses and cost protection via rate limiting. The research confirms that the modern stack (Next.js 15 App Router + Vercel AI SDK + Upstash Redis) provides production-ready solutions for all requirements.

**Key findings:**
- Vercel AI SDK is the recommended approach for streaming AI responses in Next.js 15, significantly reducing boilerplate compared to raw OpenAI SDK
- `createOpenAICompatible` allows custom base URLs for proxies like kie.ai
- Upstash Redis with `@upstash/ratelimit` is the standard for serverless rate limiting with built-in daily window support
- Edge Runtime provides 25s+ timeouts for streaming (vs 10s serverless), making it ideal for AI generation
- GPT-4 models demonstrate strong multilingual performance including low-resource languages similar to Lithuanian

**Primary recommendation:** Use Vercel AI SDK with `streamText` + custom kie.ai provider configuration + Upstash Redis daily rate limiting on Edge Runtime.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | Latest | Stream AI responses | Official Vercel recommendation, reduces boilerplate, provider-agnostic API |
| `@ai-sdk/openai` | Latest | OpenAI provider for AI SDK | Official integration, supports OpenAI-compatible proxies |
| `@upstash/ratelimit` | Latest | Serverless rate limiting | Only HTTP-based rate limiter for serverless/Edge, built for Next.js |
| `@upstash/redis` | Latest | Serverless Redis client | Pairs with ratelimit, no TCP connections needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | 5.x | Type safety | All Next.js 15 projects (default) |
| Pino | Latest | Structured logging | Production monitoring, low overhead |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel AI SDK | Raw OpenAI SDK | More boilerplate, harder to switch providers, manual stream handling |
| Upstash Redis | Memory-based rate limiting | Doesn't work across serverless instances, no persistence |
| Upstash Redis | Vercel KV | Vercel-specific, less flexible algorithms |

**Installation:**
```bash
npm install ai @ai-sdk/openai @upstash/ratelimit @upstash/redis
```

## Architecture Patterns

### Recommended Project Structure

```
app/
├── api/
│   └── generate/
│       └── route.ts           # Edge route handler with streaming
├── lib/
│   ├── ai.ts                  # AI provider configuration
│   ├── rate-limit.ts          # Rate limiter singleton
│   └── logger.ts              # Structured logging setup
└── types/
    └── api.ts                 # API request/response types
```

### Pattern 1: Streaming API Route with Edge Runtime

**What:** Edge Route Handler that streams OpenAI responses via custom provider
**When to use:** All AI generation endpoints requiring streaming responses
**Example:**
```typescript
// Source: https://vercel.com/docs/functions/streaming-functions
// Source: https://ai-sdk.dev/docs/ai-sdk-core/generating-text
import { streamText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// Enable Edge Runtime
export const runtime = 'edge';
export const maxDuration = 25; // seconds

const kieai = createOpenAICompatible({
  name: 'kieai',
  apiKey: process.env.KIEAI_API_KEY,
  baseURL: process.env.KIEAI_BASE_URL, // e.g., 'https://api.kie.ai/v1'
});

export async function POST(request: Request) {
  const { prompt, industry } = await request.json();

  const result = streamText({
    model: kieai('gpt-4o'),
    messages: [
      {
        role: 'system',
        content: `You are a social media post writer for Lithuanian service providers.
Write in casual, friendly Lithuanian - like talking to a neighbor.
Use Lithuanian words over English when they exist.
Natural flow is more important than perfect grammar.
Always include a call-to-action.`
      },
      {
        role: 'user',
        content: `Generate a social media post for: ${industry}\nAbout: ${prompt}`
      }
    ],
  });

  return result.toTextStreamResponse({
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Pattern 2: Daily Rate Limiting with Redis

**What:** Distributed daily quota tracking using Upstash Redis
**When to use:** Cost protection with daily hard caps (50 generations/day requirement)
**Example:**
```typescript
// Source: https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted
// Source: https://github.com/upstash/ratelimit-js
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Singleton pattern - instantiate outside handler for caching
export const dailyRateLimit = new Ratelimit({
  redis: Redis.fromEnv(), // Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
  limiter: Ratelimit.slidingWindow(50, "24 h"), // 50 requests per 24 hours
  analytics: true,
  prefix: "ratelimit:daily",
});

// Usage in route handler
export async function POST(request: Request) {
  const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success, limit, remaining, reset } = await dailyRateLimit.limit(identifier);

  if (!success) {
    return Response.json(
      {
        error: 'Daily limit reached',
        limit,
        remaining: 0,
        resetAt: new Date(reset).toISOString(),
        message: 'You have reached your daily limit. Need more? Contact us.'
      },
      { status: 429 }
    );
  }

  // Add rate limit info to response headers
  const response = await handleGeneration();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

  return response;
}
```

### Pattern 3: Environment Variable Security

**What:** Server-only environment variables for API keys
**When to use:** All sensitive credentials (NEVER prefix with NEXT_PUBLIC_)
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/data-security
// .env.local (NEVER commit this file)
KIEAI_API_KEY=sk-xxx...
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

// Access only in server components/route handlers
// NOT accessible to browser
const apiKey = process.env.KIEAI_API_KEY;

// Edge Runtime supports process.env for env vars
// Note: Edge Runtime cannot read files, only env vars
```

### Anti-Patterns to Avoid

- **Buffered streaming:** Don't return a Response after completing the stream loop - use `toTextStreamResponse()` which returns immediately
- **Public API keys:** Never use `NEXT_PUBLIC_` prefix for AI/database credentials
- **Per-request rate limiter instantiation:** Create `Ratelimit` instance outside handler to cache connection
- **Missing error handling in streams:** Vercel AI SDK handles errors as part of stream (doesn't crash), but always validate inputs before streaming

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI response streaming | Custom ReadableStream + SSE parsing | Vercel AI SDK `streamText` | Handles chunking, error recovery, backpressure, multiple providers |
| Rate limiting | In-memory counters | `@upstash/ratelimit` | Distributed, survives cold starts, multiple algorithms, analytics |
| OpenAI API client | `fetch` wrapper | `@ai-sdk/openai` or `createOpenAICompatible` | Type safety, retries, streaming, provider abstraction |
| Streaming HTTP response | Manual `res.write()` calls | AI SDK `toTextStreamResponse()` | Proper headers, Edge-compatible, no buffering |

**Key insight:** Serverless streaming and rate limiting have subtle gotchas (cold starts, buffering, TCP connections). Battle-tested libraries handle edge cases you won't discover until production.

## Common Pitfalls

### Pitfall 1: SSE Buffering in Next.js

**What goes wrong:** Chunks arrive all at once instead of progressively streaming to client
**Why it happens:** Next.js waits for route handler to complete before sending Response; using `async for await` loop buffers all chunks before returning
**How to avoid:** Use Vercel AI SDK's `toTextStreamResponse()` which returns immediately with a streaming Response object
**Warning signs:** Client sees loading state, then entire text appears instantly; browser DevTools shows single network response instead of chunked transfer

**Source:** [Fixing Slow SSE Streaming in Next.js and Vercel](https://medium.com/@oyetoketoby80/fixing-slow-sse-server-sent-events-streaming-in-next-js-and-vercel-99f42fbdb996) (January 2026)

### Pitfall 2: Rate Limiter Cold Starts

**What goes wrong:** Rate limit counter resets on serverless cold starts when using in-memory storage
**Why it happens:** Each serverless instance has separate memory; no shared state between invocations
**How to avoid:** Use external store like Upstash Redis which persists across all instances globally
**Warning signs:** Users can exceed limits by waiting for function to go cold; rate limits behave inconsistently

**Source:** [Upstash Ratelimit Documentation](https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted)

### Pitfall 3: Edge Runtime Environment Limitations

**What goes wrong:** Code that works locally fails on Vercel Edge with "module not found" or filesystem errors
**Why it happens:** Edge Runtime uses restricted Web APIs only - no Node.js modules, no filesystem access, no TCP
**How to avoid:** Test with `export const runtime = 'edge'` locally; use Edge-compatible libraries (Upstash, jose for JWT, etc.)
**Warning signs:** Build succeeds but runtime errors in production; libraries using `fs`, `net`, or Node builtins fail

**Source:** [Authentication in Next.js Middleware: Edge Runtime Limitations](https://medium.com/@shuhan.chan08/authentication-in-next-js-middleware-edge-runtime-limitations-solutions-7692a44f47ab)

### Pitfall 4: Exposed API Keys in Client

**What goes wrong:** API keys leak in browser bundle, leading to unauthorized usage and cost overruns
**Why it happens:** Using `NEXT_PUBLIC_` prefix or importing server-only code in client components
**How to avoid:** NEVER prefix secrets with `NEXT_PUBLIC_`; access `process.env` only in Route Handlers/Server Components
**Warning signs:** API key visible in browser DevTools; unexpected API usage from unknown sources

**Source:** [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security)

## Code Examples

Verified patterns from official sources:

### Streaming Text Generation with Custom Provider

```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/provider-management
// app/lib/ai.ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const kieai = createOpenAICompatible({
  name: 'kieai',
  apiKey: process.env.KIEAI_API_KEY!,
  baseURL: process.env.KIEAI_BASE_URL!, // https://api.kie.ai/v1 or similar
});

// app/api/generate/route.ts
import { streamText } from 'ai';
import { kieai } from '@/lib/ai';

export const runtime = 'edge';
export const maxDuration = 25;

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: kieai('gpt-4o'),
    messages,
  });

  return result.toTextStreamResponse();
}
```

### Rate Limiting Check with Quota Info

```typescript
// Source: https://github.com/upstash/ratelimit-js
// app/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const dailyLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, "24 h"),
  analytics: true,
  prefix: "daily",
});

// app/api/generate/route.ts
import { dailyLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success, limit, remaining, reset } = await dailyLimit.limit(ip);

  if (!success) {
    const resetDate = new Date(reset);
    return Response.json({
      error: 'Daily limit exceeded',
      limit,
      remaining: 0,
      resetAt: resetDate.toISOString(),
      message: `Limit resets at ${resetDate.toLocaleTimeString()}. Need more? Contact us.`
    }, { status: 429 });
  }

  // Continue with generation...
}
```

### Checking Remaining Quota

```typescript
// Source: https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted
import { dailyLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';

  // Check quota without consuming
  const remaining = await dailyLimit.getRemaining(ip);

  return Response.json({
    remaining,
    limit: 50,
  });
}
```

### TypeScript Types for API

```typescript
// app/types/api.ts
export interface GenerateRequest {
  industry: string;
  prompt: string;
  tone?: 'casual' | 'professional';
}

export interface GenerateResponse {
  text: string;
}

export interface RateLimitError {
  error: string;
  limit: number;
  remaining: number;
  resetAt: string;
  message: string;
}

// Usage in route handler
export async function POST(request: Request) {
  const body: GenerateRequest = await request.json();
  // TypeScript validates structure
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router API routes | App Router Route Handlers | Next.js 13+ | Better streaming support, Edge Runtime, simpler async/await |
| Manual OpenAI SDK with streams | Vercel AI SDK `streamText` | 2024-2025 | 80% less boilerplate, provider-agnostic |
| GET routes cached by default | GET routes uncached by default | Next.js 15 | Must opt-in to caching, better for API routes |
| `res.write()` for streaming | `toTextStreamResponse()` | Next.js 13+ | No buffering issues, proper Edge support |
| Fixed window rate limiting | Sliding window algorithms | 2024+ | Smoother traffic distribution, no stampede effect |

**Deprecated/outdated:**
- **Pages Router API Routes (`pages/api/*`)**: Still supported but App Router Route Handlers are recommended for new projects
- **`pipeTextStreamToResponse()`**: Older API for Node.js Response objects; use `toTextStreamResponse()` which returns Web API Response
- **Vercel KV direct usage for rate limiting**: `@upstash/ratelimit` provides better algorithms and analytics

## Open Questions

Things that couldn't be fully resolved:

1. **Kie.ai OpenAI API Compatibility**
   - What we know: Kie.ai provides API key authentication and supports multiple AI providers
   - What's unclear: Whether kie.ai proxy is 100% OpenAI-compatible (streaming, chat completions format)
   - Recommendation: Test `createOpenAICompatible` with kie.ai in development; fallback to direct OpenAI if incompatible

2. **Lithuanian Language Quality**
   - What we know: GPT-4 performs well on low-resource languages including Latvian (similar to Lithuanian)
   - What's unclear: Specific Lithuanian performance benchmarks or prompt engineering guidance
   - Recommendation: Start with GPT-4o, test with real Lithuanian posts, iterate on prompts based on output quality

3. **Rate Limit Identifier Strategy**
   - What we know: Can use IP address, session ID, or API key for rate limiting
   - What's unclear: Anonymous users sharing same IP (coffee shop, office) vs privacy concerns
   - Recommendation: Use IP address (`x-forwarded-for`) for Phase 1 (simplest), document as known limitation

4. **Daily vs Per-Request Logging**
   - What we know: Should log usage counts for monitoring
   - What's unclear: Whether to log every request or aggregate daily
   - Recommendation: Log every generation with structured data (timestamp, IP, model, success/error) for Phase 1 analysis

## Sources

### Primary (HIGH confidence)

- [Next.js Route Handlers Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/route) - Official API route structure
- [Vercel Functions Streaming Documentation](https://vercel.com/docs/functions/streaming-functions) - Official streaming guide with AI SDK examples
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) - Official AI SDK reference
- [AI SDK streamText Reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) - Official streamText API
- [AI SDK Provider Management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management) - Custom provider configuration
- [Upstash Ratelimit Documentation](https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted) - Official rate limiting guide
- [Upstash Ratelimit GitHub](https://github.com/upstash/ratelimit-js) - Source code and examples
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security) - Official security best practices

### Secondary (MEDIUM confidence)

- [LogRocket: Real-time AI in Next.js](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/) - November 2025 tutorial on Vercel AI SDK streaming
- [DEV: Vercel AI SDK Complete Guide](https://dev.to/pockit_tools/vercel-ai-sdk-complete-guide-building-production-ready-ai-chat-apps-with-nextjs-4cp6) - January 2026 production patterns
- [Upstash Blog: Next.js Rate Limiting](https://upstash.com/blog/nextjs-ratelimiting) - Practical implementation guide
- [Upstash Blog: Edge Rate Limiting](https://upstash.com/blog/edge-rate-limiting) - Edge-specific patterns
- [Better Stack: Next.js Error Handling](https://betterstack.com/community/guides/scaling-nodejs/error-handling-nextjs/) - Error handling patterns
- [Next.js 15 Project Structure Best Practices](https://www.codebydeep.com/blog/next-js-folder-structure-best-practices-for-scalable-applications-2026-guide) - 2026 organizational patterns

### Tertiary (LOW confidence)

- [Kie.ai Getting Started](https://docs.kie.ai) - Limited information on OpenAI compatibility
- [Medium: Fixing Slow SSE Streaming](https://medium.com/@oyetoketoby80/fixing-slow-sse-server-sent-events-streaming-in-next-js-and-vercel-99f42fbdb996) - January 2026 article on streaming gotchas
- [Medium: Edge Runtime Limitations](https://medium.com/@shuhan.chan08/authentication-in-next-js-middleware-edge-runtime-limitations-solutions-7692a44f47ab) - Community article on Edge constraints

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Vercel recommendations, verified in documentation
- Architecture: HIGH - Patterns from official docs and production templates
- Pitfalls: MEDIUM - Mix of official docs and recent community reports (2025-2026)
- Kie.ai integration: LOW - Limited documentation on OpenAI compatibility specifics

**Research date:** 2026-01-25
**Valid until:** 2026-02-24 (30 days - stable ecosystem)

**Note on kie.ai:** Documentation found was limited regarding OpenAI API compatibility. Testing required to confirm streaming support and exact endpoint format. If incompatible with `createOpenAICompatible`, may need custom fetch implementation or direct OpenAI integration.
