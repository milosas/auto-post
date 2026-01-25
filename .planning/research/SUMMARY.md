# Project Research Summary

**Project:** AI Social Media Post Generator for Lithuanian Service Providers
**Domain:** AI content generation tool for social media marketing
**Researched:** 2026-01-25
**Confidence:** HIGH

## Executive Summary

This is an AI-powered content generation tool targeting Lithuanian small service businesses (beauty specialists, trainers, physiotherapists) who need to create social media posts quickly. Research shows the market is crowded with feature-rich tools, but success lies in being dramatically simpler—not more feature-rich. The winning strategy is speed and focus: generate a complete Lithuanian post in under 60 seconds.

The recommended approach uses React + Vite + Vercel serverless architecture with OpenAI integration via streaming responses. This stack prioritizes development speed and zero-config deployment while keeping costs predictable. The architecture follows established patterns: unidirectional data flow, security-first API design (server-side proxy), and progressive enhancement through streaming. Start with direct OpenAI integration for reliability, consider kie.ai proxy only after validating cost savings outweigh reliability risks.

The biggest risks are API cost runaway (can bankrupt overnight), Lithuanian language quality issues (limited training data), and Vercel timeout limitations (10s free tier vs 15-30s generation time). These aren't minor issues—they're project killers that require explicit mitigation from day one. Success requires: hard spending limits before any deployment, extensive Lithuanian prompt testing, streaming implementation (not optional), and using Vercel Edge Functions (25s timeout) or split-function architecture.

## Key Findings

### Recommended Stack

The stack is modern, well-supported, and optimized for AI workloads. React 18.3+ with Vite 6.x provides fast development experience without Next.js overhead (SSR/SSG not needed for SPA). Vercel serverless functions handle API routes with zero-config deployment and automatic scaling. Vercel AI SDK provides unified LLM integration with streaming support and provider abstraction.

**Core technologies:**
- **React 18.3+ + Vite 6.x**: Fast HMR, modern ES modules, optimal for single-page AI apps — chosen over Next.js because SSR adds complexity without value for this use case
- **Vercel AI SDK 6.0.49**: Streaming responses, provider-agnostic, React hooks integration — better DX than direct OpenAI SDK, enables easy provider switching
- **Zustand 5.0.10 + TanStack Query 5.90.20**: Client state (UI) + server state (AI responses) separation — prevents Context API re-render issues, automatic request caching saves costs
- **React Hook Form 7.71.1**: Minimal re-renders for multi-step wizard — critical for 60-second performance target
- **html-to-image 1.11.13**: DOM to PNG export with better text rendering than html2canvas — users download generated posts as images
- **Headless UI 2.2+**: Accessible unstyled components for Tailwind — official Tailwind Labs library for modals, dropdowns, tabs

**Critical decisions:**
- Start with direct OpenAI API for reliability; evaluate kie.ai proxy (30-50% cost savings) only after MVP validation
- Use Vercel Edge Functions (25s timeout) instead of Serverless Functions (10s timeout) to avoid DALL-E generation failures
- No database for MVP (client-side state only); add Vercel KV for rate limiting and cost tracking
- Lithuanian fonts via Google Fonts with `latin-ext` subset for proper character support (ą, č, ę, ė, į, š, ų, ū, ž)

**Migration alert:** DALL-E 3 deprecates May 12, 2026. Plan migration to GPT-Image-1 (50% cheaper, better quality) by Q2 2026.

### Expected Features

The competitive landscape is mature and crowded. Users expect AI generation and customization as table stakes. Competitive advantage comes from Lithuanian-first design, industry-specific templates, and speed obsession (60-second guarantee).

**Must have (table stakes):**
- AI text generation in Lithuanian — 79% of social media managers use AI daily; baseline expectation in 2026
- Tone/style control (3-5 presets) — casual vs professional vs promotional expected by users
- Platform optimization (Facebook/Instagram) — different character limits and formatting requirements
- Copy to clipboard — critical for copy-paste workflow and 60-second goal
- Image upload with preview — service providers have treatment photos to use
- Mobile-friendly interface — many users work on phones; desktop-only is dealbreaker
- Emoji integration — posts with emojis get higher engagement; auto-suggest expected

**Should have (competitive differentiators):**
- Industry-specific templates — beauty/wellness has specific patterns; templates save thinking time
- Lithuanian-first design — all UI, examples, templates in Lithuanian; signals "built for you"
- 60-second guarantee — explicit speed promise forces ruthless simplicity
- No account required — reduces friction; can use immediately vs competitors requiring login
- Industry selector — automatically adjusts tone/vocabulary for beauty vs fitness vs therapy
- Local market awareness — references Lithuanian holidays, seasonal services (summer prep, winter skincare)

**Defer (v2+):**
- Image generation (AI-generated images) — users likely have real photos; generation is fallback
- Advanced templates — start with 3-5 per industry, expand based on usage
- Hashtag auto-suggest — Instagram limits to 5 in 2026; auto-suggest 3-5 is sufficient

**Explicitly excluded (anti-features):**
- Post scheduling — adds OAuth complexity; users can schedule natively in Facebook/Instagram
- Direct publishing to platforms — API maintenance burden; copy-paste works everywhere
- Analytics dashboard — users have native platform analytics; duplicating adds bloat
- Team collaboration — target users are solo practitioners or tiny teams (1-2 people)
- Content calendar — service providers post reactively, not strategic campaigns
- A/B testing — too sophisticated for market; users don't have volume for meaningful tests
- Brand kit (colors/fonts/logos) — focus on text quality, not visual design (Canva owns that space)

### Architecture Approach

The architecture follows modern React patterns with serverless backend: three-tier structure (Frontend UI → API Gateway → AI Services), unidirectional data flow, and streaming for progressive enhancement. Security-first design never exposes API keys to client.

**Major components:**
1. **Frontend (React SPA)** — Single App.jsx owns all state, presentational components are stateless (industry selector, image uploader, post settings, output). Uses Zustand for client state (UI), TanStack Query for server state (AI responses). No routing (single-page wizard with conditional rendering).
2. **API Gateway (Vercel Serverless)** — Two functions: `/api/generate-post.js` (text generation with streaming) and `/api/generate-image.js` (DALL-E integration). Handles validation, rate limiting, API key security. All external AI calls proxied through backend.
3. **AI Services (OpenAI)** — GPT-4/GPT-4o for Lithuanian text generation, DALL-E 3/GPT-Image-1 for image generation. Accessed via Vercel AI SDK for streaming support and provider abstraction.

**Critical patterns:**
- **Streaming responses**: Progressive text display as tokens arrive (like ChatGPT); dramatically improves perceived performance vs 15-30s blank screen
- **Unidirectional data flow**: State flows down (parent → child via props), events flow up (child → parent via callbacks); prevents spaghetti code
- **Security-first**: API keys stored in Vercel environment variables, accessed server-side only; client calls backend, backend calls OpenAI
- **Feature-based folder structure**: Organize by domain (/post-generation, /image-generation) not file type; scales better than grouping all components together

**Build order (dependency-based):**
1. Foundation: API routes + basic hooks + minimal UI (proves OpenAI integration works)
2. Input layer: Form components → state → API (build from data source to consumer)
3. Streaming UX: Upgrade API + hooks + output component (coordinated stack changes)
4. Images: Separate feature, can be built in parallel with text streaming
5. Polish: Error handling, loading states, rate limiting, validation

### Critical Pitfalls

Research identified 5 project-killing pitfalls that require explicit mitigation in every phase:

1. **Uncontrolled API cost runaway** — Without spending limits, a single bug or malicious user generates thousands in OpenAI charges overnight. Prevent with: hard OpenAI monthly budget ($50/month with automatic cutoff), rate limiting (5 posts/hour per IP via Vercel KV), `max_tokens` parameter on every call, secure API key management (never in frontend). Implement BEFORE any deployment.

2. **Lithuanian language quality issues** — AI models trained primarily on English produce poor Lithuanian content (unnatural phrasing, grammatical errors, cultural mismatches). Prevent with: explicit prompt engineering ("expert Lithuanian copywriter for small service businesses"), formality specification ("jūs, not tu"), 10-15 test scenarios during development, manual quality review by native speakers. Poor quality = immediate user abandonment.

3. **Vercel serverless timeout vs 60-second target** — Vercel Hobby plan has 10s timeout; text (3-5s) + image (10-20s) generation exceeds limit causing 504 errors. Prevent with: use Vercel Edge Functions (25s timeout) instead of Serverless Functions (10s), implement streaming (reduces perceived latency), split into separate `/api/generate-text` and `/api/generate-image` functions, provide "skip image" option. Streaming is not optional—it's required for acceptable UX.

4. **DALL-E content policy false positives** — DALL-E filter blocks harmless Lithuanian prompts; over-triggers on non-English text and location references. Prevent with: translate Lithuanian prompts to English before DALL-E API, use pre-approved prompt templates for common business types, catch `content_policy_violation` errors gracefully, provide fallback ("skip image" or generic stock photo). Build test suite of 50+ Lithuanian business prompts.

5. **No-database architecture blindspots** — Stateless architecture means no usage tracking, error logging, user history, or improvement feedback loop. Can't identify problems, optimize prompts, or implement effective rate limiting. Mitigate with: Vercel KV for lightweight state (IP rate limits, cost tracking), Vercel Analytics for function metrics, error tracking service (Sentry free tier), IP-based rate limiting (accept VPN bypass limitations). Accept MVP constraints but plan database migration path for Phase 4+.

## Implications for Roadmap

Based on research, suggested phase structure prioritizes risk mitigation and quick validation:

### Phase 1: Foundation & Risk Mitigation
**Rationale:** Eliminate project-killing risks before building features. Research shows cost runaway and timeout failures can bankrupt projects overnight. Must prove OpenAI integration works and costs are controlled before investing in UI.

**Delivers:** Working text generation API with streaming, hard spending limits, rate limiting, Lithuanian quality validation.

**Addresses:**
- Core API integration (`/api/generate-post.js` with streaming)
- OpenAI spending limit ($50/month with alerts at 50%, 75%, 90%)
- Rate limiting via Vercel KV (5 posts/hour per IP)
- Lithuanian prompt engineering (test 15+ scenarios)
- Vercel Edge Functions setup (25s timeout vs 10s serverless)
- Basic error handling and monitoring

**Avoids:**
- Pitfall 1: Cost runaway (hard limits + rate limiting + max_tokens)
- Pitfall 2: Poor Lithuanian quality (prompt testing + iteration)
- Pitfall 3: Timeout failures (Edge Functions + streaming)

**Research flag:** No additional research needed—stack and patterns well-documented.

### Phase 2: MVP Core Features
**Rationale:** Build minimal viable workflow based on table stakes features. Focus on "industry selector → settings → generate → copy" flow. Skip image generation initially to validate text quality and UX without DALL-E complexity.

**Delivers:** Complete text-only post generator with mobile-responsive UI.

**Implements:**
- App.jsx with Zustand state management
- IndustrySelector component (5 industries: beauty, trainer, physio, massage, cosmetology)
- PostSettings component (tone, length, platform, emoji toggle)
- PostOutput component with copy-to-clipboard
- Mobile-first responsive design (Tailwind + Headless UI)
- Character count and platform-specific validation

**Addresses:**
- Must-have features: AI generation, tone control, platform optimization, copy button, mobile UI
- Industry-specific differentiation (industry selector)
- 60-second workflow validation (measure time-to-copy)

**Avoids:**
- Pitfall 9: Poor UX from non-streaming (streaming implemented in Phase 1)
- Pitfall 10: Mobile design neglect (mobile-first from day one)

**Research flag:** No additional research needed—UI patterns established.

### Phase 3: Image Support
**Rationale:** Add image upload first (users have photos), defer AI generation (fallback only). Research shows service providers prefer real treatment photos for authenticity. DALL-E adds complexity (content policy, timeouts, costs).

**Delivers:** Image upload with preview, download post as image (text + photo overlay), optional DALL-E generation.

**Implements:**
- ImageUploader component (drag-drop or file picker)
- html-to-image integration (DOM to PNG export)
- PreviewCard component (social media post simulation)
- Optional: `/api/generate-image.js` with DALL-E integration
- Image download with filename: `business-post-2026-01-25.png`
- 1-hour URL expiration messaging

**Addresses:**
- Must-have: Image upload with preview
- Should-have: Image export for easy sharing
- Defer: AI image generation (test demand first)

**Avoids:**
- Pitfall 4: DALL-E content policy (translate prompts to English, test business scenarios)
- Pitfall 7: Image expiration issues (auto-download, clear messaging)

**Research flag:** Needs testing of DALL-E with Lithuanian business types (restaurants, salons, fitness). May need 2-3 days of prompt iteration.

### Phase 4: Differentiators & Polish
**Rationale:** Add competitive advantages after core workflow validated. Industry templates and Lithuanian market awareness require content creation (not just code). UX refinements based on Phase 2-3 user feedback.

**Delivers:** Industry-specific templates, seasonal content awareness, advanced error handling, analytics.

**Implements:**
- Template library (3-5 templates per industry: "Before/After", "Tip of the Day", "Client Testimonial")
- Lithuanian seasonal awareness (reference holidays, seasonal services)
- Advanced error handling (retry logic, user-friendly messages)
- Usage analytics (Vercel Analytics + event tracking)
- Onboarding flow for non-technical users
- Accessibility improvements (alt text generation, WCAG compliance)

**Addresses:**
- Should-have: Industry templates, local market awareness, Lithuanian-first design
- Minor pitfalls: Insufficient onboarding, accessibility neglect

**Avoids:**
- Pitfall 6: Generic content (templates provide structure)
- Pitfall 11: Poor onboarding (guidance for non-technical users)

**Research flag:** Needs content creation for templates—not technical research, but copywriting in Lithuanian. Estimate 1-2 weeks for template library across 5 industries.

### Phase Ordering Rationale

- **Phase 1 before features:** Research shows cost runaway and timeout failures kill projects before they launch. Spending limits, rate limiting, and streaming are non-negotiable foundation—not nice-to-haves.
- **Text before images:** Validates Lithuanian quality and core value prop without DALL-E complexity. Images are enhancement, not core (users have photos).
- **Upload before generation:** Service providers prefer authentic photos. AI generation is fallback for users without photos, not primary workflow.
- **Templates last:** Require content creation, not just code. Better to validate core workflow first, then optimize with templates based on usage patterns.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Image Generation):** DALL-E content policy behavior with Lithuanian business prompts is unpredictable. Need 2-3 days of testing across industry types (food, beauty, fitness) to build safe prompt templates. Community reports show false positives on harmless prompts, especially non-English.
- **Phase 4 (Templates):** Not technical research, but content creation. Need Lithuanian copywriter familiar with service provider marketing to write 15-25 templates (3-5 per industry). Budget 1-2 weeks for template library development.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Vercel AI SDK streaming, Vercel KV rate limiting, OpenAI integration—all well-documented with official examples.
- **Phase 2 (MVP Core):** React Hook Form, Zustand, Tailwind + Headless UI—mature libraries with extensive documentation and examples.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified with official docs (Vercel AI SDK, OpenAI, Vite). React + serverless pattern proven for AI apps. Version compatibility confirmed. |
| Features | HIGH | Feature landscape based on 10+ competitor analyses. Table stakes consensus across sources. Lithuanian-first differentiation validated by market gap analysis. |
| Architecture | HIGH | Patterns verified with official React.dev, Vercel docs, AWS serverless blog. Streaming implementation documented in Vercel AI SDK. Unidirectional data flow is established best practice. |
| Pitfalls | MEDIUM-HIGH | Cost runaway, timeouts, content policy verified with official OpenAI/Vercel docs (HIGH). Lithuanian quality issues verified with government sources (MEDIUM). Kie.ai reliability has limited data (LOW). |

**Overall confidence:** HIGH

Research quality is strong across all areas. Stack decisions are well-supported. Architecture patterns are proven. Critical pitfalls have documented mitigation strategies. Main uncertainty is Lithuanian-specific behavior (language quality, DALL-E prompts), which requires testing during implementation.

### Gaps to Address

- **Kie.ai proxy reliability**: Limited public reviews (2 on Trustpilot), integration complexity reported. Recommendation: Start with direct OpenAI for reliability, evaluate kie.ai in Phase 3+ after cost patterns are known. Don't introduce third-party dependency until MVP validated.

- **Lithuanian language quality thresholds**: Research confirms challenges (limited training data, complex grammar) but doesn't provide quality benchmarks. How to handle: Create 15-scenario test suite during Phase 1, establish quality criteria with Lithuanian native speakers, iterate prompts until 90%+ scenarios pass quality review.

- **Actual DALL-E generation times**: Documentation says "10-30 seconds" but variance is high. Need production testing to determine if Vercel Edge Functions (25s timeout) are sufficient or if split-function architecture is required. Test in Phase 1 before committing to Phase 3 architecture.

- **Real-world API costs**: OpenAI pricing is per-token and variable. Need production usage patterns to validate budget assumptions. Mitigation: Conservative spending limit ($50/month) with weekly reviews during Phase 1-2. Scale limits based on actual data.

- **Mobile usage patterns**: Research suggests 60%+ mobile for service providers, but needs validation. How to handle: Mobile-first design from day one (Phase 2), track desktop vs mobile analytics in Phase 4 to optimize.

## Sources

### Primary (HIGH confidence)
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) — streaming, provider abstraction, React hooks
- [OpenAI API Documentation](https://platform.openai.com/docs/guides/rate-limits) — rate limits, content policy, best practices
- [Vercel Serverless Functions](https://vercel.com/docs/functions) — timeout limits, deployment, environment variables
- [React.dev Official Docs](https://react.dev/learn/thinking-in-react) — unidirectional data flow, component patterns
- [Lithuanian AI Language Initiative](https://eimin.lrv.lt/en/structure-and-contacts/news-1/eimin-12-million-for-ai-solutions-for-the-lithuanian-language/) — €12M government funding confirms language challenges

### Secondary (MEDIUM confidence)
- [Social Media Trends 2026 (Multiple sources)](https://slateteams.com/blog/social-media-trends-2026) — AI usage (79% of social media managers), hashtag limits (Instagram 5 max)
- [React State Management 2025](https://dev.to/cristiansifuentes/react-state-management-in-2025-context-api-vs-zustand-385m) — Zustand vs Context API for performance
- [Best React Form Libraries 2025](https://snappify.com/blog/best-react-form-libraries) — React Hook Form comparison
- [Serverless AI Patterns (AWS Blog)](https://aws.amazon.com/blogs/compute/serverless-generative-ai-architectural-patterns/) — streaming, timeout handling

### Tertiary (LOW confidence, needs validation)
- [Kie.ai Reviews](https://www.trustpilot.com/review/kie.ai) — only 2 reviews; insufficient data for reliability assessment
- [DALL-E Content Policy Community Reports](https://community.openai.com/t/dall-e-falsely-and-repeatedly-claiming-im-breaking-content-policies-pure-lies/468967) — anecdotal false positive reports; official policy doesn't explain Lithuanian-specific behavior

---
*Research completed: 2026-01-25*
*Ready for roadmap: yes*
