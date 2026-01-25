# Domain Pitfalls: AI Social Media Post Generator

**Domain:** AI content generation tool for Lithuanian small business social media
**Researched:** 2026-01-25
**Confidence:** MEDIUM (verified with official sources + web research)

## Executive Summary

AI social media post generators face unique pitfalls that cause project failures, user abandonment, and runaway costs. For a Lithuanian-only, no-database serverless tool targeting non-technical users, the most critical risks are:

1. **Cost runaway** from unmonitored API usage (can bankrupt project overnight)
2. **Lithuanian language quality issues** (limited training data leads to poor outputs)
3. **Serverless timeout failures** (Vercel's 10s limit vs 60s target creates mismatch)
4. **DALL-E content policy false positives** (blocks harmless Lithuanian prompts)
5. **No-database stateless architecture** (can't track usage, fix issues, or improve)

These aren't minor issues—they're project killers. Each requires explicit mitigation in roadmap planning.

---

## Critical Pitfalls

Mistakes that cause rewrites, project abandonment, or major financial damage.

### Pitfall 1: Uncontrolled API Cost Runaway

**What goes wrong:**
Without spending limits, a single bug or malicious user can generate thousands of dollars in OpenAI API charges overnight. Teams discover catastrophic bills days later when credit card statements arrive.

**Why it happens:**
- No database means no usage tracking per user/session
- Serverless functions execute independently with no global state
- OpenAI charges per token, making costs variable and unpredictable
- DALL-E image generation costs $0.04-0.12 per image (adds up fast)
- Retry logic without exponential backoff can amplify costs 10x
- Exposed API keys in frontend code (common mistake) allow abuse

**Real-world impact:**
- 40% of time saved from AI is spent fixing errors, including runaway costs
- One compromised API key can generate $10,000+ bills in hours
- Research shows inadequate monitoring catches runaway costs only after damage is done

**Consequences:**
- Project becomes financially unsustainable
- Credit card chargebacks/disputes
- Need to rebuild with cost controls (expensive refactor)
- Loss of trust if users are charged for service issues

**Prevention strategies:**

1. **Hard spending limits (API level):**
   - Set OpenAI monthly budget with automatic cutoff
   - Configure email alerts at 50%, 75%, 90% thresholds
   - Use prepaid billing to guarantee spending cap
   - Set `max_tokens` parameter on every API call (prevents runaway generation)

2. **Rate limiting (application level):**
   - Implement Vercel Edge Config or KV for rate limiting by IP/session
   - Limit: 5 post generations per hour per IP (adjust based on UX needs)
   - Block requests after limit with clear user messaging
   - Use exponential backoff (3s, 9s, 27s delays) on retries

3. **Cost monitoring:**
   - Daily usage queries via OpenAI API usage endpoint
   - Log all API calls with token counts to Vercel Analytics
   - Alert when daily spending exceeds threshold (e.g., $10/day)
   - Weekly cost reviews during development

4. **Secure API key management:**
   - Never expose OpenAI API key in frontend code
   - Use environment variables in Vercel serverless functions only
   - Proxy all API calls through backend endpoints
   - Consider kie.ai's credit system for additional cost control layer

**Detection warning signs:**
- Vercel function invocation count spikes unexpectedly
- OpenAI dashboard shows unusual usage patterns
- Users report slow responses (may indicate retry loops)
- Credit card pre-authorization alerts

**Phase mapping:**
- **Phase 1 (Foundation):** Implement hard spending limits and rate limiting BEFORE any production deployment
- **Phase 2 (MVP):** Add cost monitoring dashboard and alerts
- **Phase 3+:** Optimize token usage based on production data

**Sources:**
- [OpenAI API Rate Limiting Best Practices](https://help.openai.com/en/articles/6891753-what-are-the-best-practices-for-managing-my-rate-limits-in-the-api)
- [OpenAI Cost Monitoring](https://www.toriihq.com/articles/how-to-monitor-spending-openai)
- [Preventing Runaway Bills](https://www.finout.io/blog/openai-pricing-in-2026)

---

### Pitfall 2: Lithuanian Language Quality Issues

**What goes wrong:**
AI models trained primarily on English produce poor-quality Lithuanian content: unnatural phrasing, grammatical errors (7 noun cases!), inappropriate formality levels, and cultural mismatches. Small business users expect professional posts; generic AI-translated content damages their brand.

**Why it happens:**
- Only 12 languages used on 98% of webpages; English is 72%
- Lithuanian has limited digital presence in training data
- Complex grammar: 7 noun cases, 2 genders, pitch accent affects meaning
- Cultural context (Lithuanian service provider norms) not in training data
- OpenAI models optimize for English; Lithuanian is lower priority
- Prompting in Lithuanian may trigger DALL-E content policy false positives

**Real-world impact:**
- Lithuania allocated €12M for AI language solutions due to these challenges
- Small market (2.8M speakers) means limited commercial AI focus
- Target users (non-technical service providers) can't debug bad translations
- Poor Lithuanian quality = immediate user abandonment

**Consequences:**
- Users generate unprofessional posts, damage their brand, abandon tool
- Can't differentiate from free tools (Google Translate + Canva)
- No word-of-mouth growth if quality is poor
- Must add human-in-the-loop editing (defeats "60-second" value prop)

**Prevention strategies:**

1. **Prompt engineering for Lithuanian:**
   - Include explicit role: "You are an expert Lithuanian copywriter for small service businesses"
   - Specify formality: "Use professional but warm tone (jūs, not tu)"
   - Reference Lithuanian marketing norms in system prompt
   - Provide few-shot examples of good Lithuanian social media posts
   - Use structured prompts with clear sections (headline, body, CTA)

2. **Quality validation:**
   - Create 10-15 test scenarios covering different service types
   - Manual Lithuanian quality review during development
   - Test with actual Lithuanian small business owners (UX testing)
   - Flag low-confidence generations for user review

3. **Hybrid approach:**
   - Generate content in English first, then translate (may produce better results)
   - Provide template library with verified Lithuanian phrasing
   - Allow users to save/reuse successful posts (builds quality corpus)
   - Consider Lithuanian language model fine-tuning if budget allows (future phase)

4. **DALL-E prompt handling:**
   - Convert Lithuanian image requests to English before DALL-E API
   - Avoid location-specific terms that may trigger false positives
   - Use descriptive visual terms, not cultural references
   - Test prompts for content policy violations in development

**Detection warning signs:**
- User feedback about "weird" or "unnatural" phrasing
- High edit rates (users fixing generated content)
- Low reuse rates (users don't publish generated posts)
- Competitors' Lithuanian quality is noticeably better

**Phase mapping:**
- **Phase 1 (Foundation):** Test Lithuanian quality extensively, build prompt templates
- **Phase 2 (MVP):** Implement quality validation, gather user feedback
- **Phase 3+:** Consider fine-tuning or hybrid approaches based on feedback

**Sources:**
- [Lithuanian AI Language Challenges](https://eimin.lrv.lt/en/structure-and-contacts/news-1/eimin-12-million-for-ai-solutions-for-the-lithuanian-language/)
- [Lithuanian Language Technology Requirements](https://tilde.ai/case-study/technology-is-crucial-to-preserve-the-lithuanian-language/)
- [Master Lithuanian with AI Technology](https://talkpal.ai/master-lithuanian-fast-learn-lithuanian-with-ai-technology/)

---

### Pitfall 3: Vercel Serverless Timeout vs. 60-Second Target

**What goes wrong:**
Vercel's Hobby plan has 10-second timeout limit. Generating a post with OpenAI + DALL-E image easily takes 15-30 seconds (text generation 3-5s, image generation 10-20s), causing 504 Gateway Timeout errors. Users see loading spinner, then error. Project fails to deliver core value proposition.

**Why it happens:**
- OpenAI text generation: 2-8 seconds (variable based on length, load)
- DALL-E 3 image generation: 10-30 seconds (often 15-20s average)
- Sequential execution (text → image) adds delays
- Cold starts add 1-3 seconds on first serverless invocation
- No streaming means user waits for full completion
- "60-second post generation" target requires 6x Vercel's free limit

**Real-world impact:**
- Vercel free tier: 10-second timeout (guaranteed failure for image+text)
- Vercel Pro tier: 60-second timeout (costs $20/month + usage)
- Edge Functions: 25-second timeout (better, but still tight)
- Research shows users abandon AI tools when they can't tell if it's working or broken

**Consequences:**
- 90%+ request failure rate on free tier
- Forced upgrade to Pro tier ($240/year) before product validation
- User perception: "broken" tool, immediate abandonment
- Can't hit 60-second target without major architecture changes

**Prevention strategies:**

1. **Streaming implementation (critical):**
   - Stream text generation tokens as they arrive (reduces perceived latency)
   - Show progress indicators: "Generating text..." → "Creating image..." → "Almost done..."
   - Use Vercel AI SDK for streaming support
   - Users see immediate feedback, perceive faster performance

2. **Architecture adjustments:**
   - Split into two serverless functions: /api/generate-text and /api/generate-image
   - Return text immediately, fetch image asynchronously
   - Use Vercel KV or client-side state to track image generation
   - Consider "text-first, image-second" UX pattern

3. **Timeout handling:**
   - Implement client-side retry logic with exponential backoff
   - Set realistic timeout expectations in UI: "This may take 30-60 seconds"
   - Provide "Skip image" option if generation is too slow
   - Use Vercel Edge Functions (25s timeout) instead of Serverless Functions (10s)

4. **Performance optimization:**
   - Enable Vercel Fluid Compute (reduces cold starts)
   - Use smaller DALL-E models if quality allows (gpt-image-1-mini)
   - Cache common image types (reduce DALL-E calls)
   - Parallel execution where possible (text + image simultaneously if applicable)

5. **Alternative: Queue-based approach:**
   - Immediate response with job ID
   - Background processing via QStash or similar
   - Poll for completion or WebSocket updates
   - More complex but handles unlimited generation time

**Detection warning signs:**
- 504 Gateway Timeout errors in Vercel logs
- High function timeout rate in Vercel Analytics
- User complaints about "stuck" loading screens
- Comparison: development works (no timeouts), production fails

**Phase mapping:**
- **Phase 1 (Foundation):** Test actual generation times, implement streaming BEFORE launch
- **Phase 2 (MVP):** Optimize performance, consider split-function architecture
- **Phase 3+:** Evaluate queue-based approach if timeout issues persist

**Sources:**
- [Vercel Serverless Function Timeouts](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)
- [Solving Vercel's 10-Second Limit](https://medium.com/@kolbysisk/case-study-solving-vercels-10-second-limit-with-qstash-2bceeb35d29b)
- [OpenAI with Vercel: Gateway Timeout Solutions](https://dev.to/buildwebcrumbs/open-ai-with-vercel-a-way-around-gateway-timeouts-1ec9)

---

### Pitfall 4: DALL-E Content Policy False Positives

**What goes wrong:**
DALL-E's content moderation filter blocks harmless Lithuanian prompts, returning "content_policy_violation" errors. Users trying to generate legitimate business images (restaurant food, hair salon styles, fitness training) get rejected. Filter over-triggers on non-English text, Lithuanian words, and even geographic references.

**Why it happens:**
- DALL-E filter optimized for English, makes more mistakes with Lithuanian
- Filter errs on side of caution (many false positives to prevent few violations)
- Lithuanian words may phonetically resemble flagged English terms
- Detailed descriptions (common in good prompts) trigger over-filtering
- Location references ("Vilnius sunset", "Kaunas street") sometimes blocked
- System can't explain why harmless prompts are rejected

**Real-world impact:**
- Simple prompts like "sunset in Kyiv" rejected as policy violations
- Users report "pencil sketch of fox" flagged incorrectly
- Clothing descriptions, beach/pool references often blocked
- Accounts can be terminated for repeated false positives (recovery takes months)
- Research shows content policy blocks especially problematic for non-English prompts

**Consequences:**
- User frustration: "Why can't I generate a photo of my salon?"
- Unpredictable failures break trust in tool
- Can't debug (OpenAI doesn't explain violations)
- May need to ban certain Lithuanian words/phrases to avoid blocks
- Competitive disadvantage vs. tools using other image generators

**Prevention strategies:**

1. **Prompt sanitization:**
   - Translate Lithuanian prompts to English before DALL-E API
   - Strip potentially triggering words (clothing details, body parts, location names)
   - Use generic visual descriptions instead of specific cultural references
   - Test common Lithuanian business scenarios in development

2. **Prompt templates:**
   - Pre-approved prompt structures for common post types
   - "Restaurant food photo" → tested, safe template
   - "Fitness class" → avoid human figures, use equipment/environment
   - "Hair salon" → show finished hairstyles, not cutting process

3. **Error handling:**
   - Catch `content_policy_violation` errors gracefully
   - Show helpful message: "Image request blocked by safety filter. Try a different description."
   - Provide alternative: generic stock photo or text-only post
   - Log violations to identify patterns and improve prompts

4. **Fallback strategy:**
   - Offer "Skip image" option if generation fails
   - Retry with simplified/generic prompt automatically
   - Consider alternative image generation API as fallback (if cost-effective)
   - Use pre-generated image library for common business types

5. **Testing and monitoring:**
   - Build test suite of 50+ Lithuanian business image prompts
   - Track content policy violation rate
   - Alert if violation rate exceeds 5% (indicates systemic issue)
   - Continuously refine prompt templates based on production data

**Detection warning signs:**
- High `content_policy_violation` error rate in logs
- User reports of "can't generate images"
- Specific business types consistently fail
- Support requests: "Why was my image blocked?"

**Phase mapping:**
- **Phase 1 (Foundation):** Build and test prompt templates, implement translation layer
- **Phase 2 (MVP):** Add error handling, fallback options, monitoring
- **Phase 3+:** Refine templates based on production violations, consider alternative providers

**Sources:**
- [DALL-E Content Policy Violations](https://community.openai.com/t/dall-e-falsely-and-repeatedly-claiming-im-breaking-content-policies-pure-lies/468967)
- [DALL-E 3 Non-English Prompt Issues](https://community.openai.com/t/concerns-over-stringent-content-policy-blocks-in-dall-e-3-api-especially-for-non-english-prompts/478274)
- [DALL-E Content Policy FAQ](https://help.openai.com/en/articles/6468065-dall-e-content-policy-faq)

---

### Pitfall 5: No-Database Architecture Blindspots

**What goes wrong:**
Stateless architecture with no database means no usage tracking, error logging, user history, or improvement feedback loop. Can't identify which users have problems, which prompts fail, or how to optimize. Can't implement rate limiting, can't fix user-reported bugs without reproduction, can't A/B test improvements. Tool becomes a black box.

**Why it happens:**
- "No database" decision trades complexity for simplicity
- Serverless functions execute independently with no shared state
- Client-side localStorage limited to 5MB, not accessible across devices
- No way to correlate user sessions without authentication
- Can't persist data between serverless function invocations
- Performance: localStorage is synchronous and blocks main thread

**Real-world impact:**
- Stateless apps face data synchronization problems across distributed systems
- Can't track API usage per user/session (cost attribution impossible)
- No audit trail for debugging production issues
- Can't build features requiring history (favorites, templates, refinement)
- Research shows stateless apps "need to retrieve data from external sources on each request, leading to additional processing time"

**Consequences:**
- Can't implement effective rate limiting (IP-based only, easily bypassed)
- No usage analytics to guide product development
- Can't offer "saved posts" or "post history" (common user expectation)
- Can't detect and block abuse (bot traffic, API key theft)
- No foundation for future features (user accounts, billing, collaboration)

**Prevention strategies:**

1. **Minimal state storage (pragmatic hybrid):**
   - Use Vercel KV (Redis) for lightweight state without full database
   - Store: IP rate limits, temporary job status, cost tracking aggregates
   - Avoid: user accounts, full post history (out of scope)
   - Cost: ~$5-10/month for low-traffic app

2. **Client-side state with limitations:**
   - Use sessionStorage (not localStorage) for single-session data
   - Store generated posts client-side for current session only
   - Clear warning: "Posts not saved. Download before closing."
   - IndexedDB for larger client-side storage (but not accessible across devices)

3. **Logging and monitoring:**
   - Vercel Analytics for function invocations, errors, performance
   - Console.log API calls with anonymized identifiers (IP hash)
   - Weekly log exports for trend analysis
   - Error tracking service (Sentry free tier) for production issues

4. **IP-based rate limiting:**
   - Vercel Edge Config for IP-based rate limits (fast, lightweight)
   - Limit: 5 generations/hour per IP
   - Store limits in Edge Config, check on each request
   - Accept limitation: VPN/proxy users can bypass (but adds friction)

5. **Future-proofing:**
   - Design API endpoints to accept optional user ID (prepare for auth later)
   - Structure code to make database addition non-breaking
   - Document "future database migration" as Phase 4+ roadmap item
   - Accept MVP constraints, plan evolution path

**Detection warning signs:**
- Can't answer basic questions: "How many posts generated today?"
- User complaints: "I lost my generated posts"
- Support burden: can't reproduce user-reported bugs
- Feature requests requiring state: "Save favorite templates"

**Phase mapping:**
- **Phase 1 (Foundation):** Accept no-database constraint, implement Vercel KV for rate limiting only
- **Phase 2 (MVP):** Add minimal logging/monitoring, IP-based limits
- **Phase 3+:** Evaluate if user demand justifies database addition

**Sources:**
- [Stateless Application Pitfalls](https://www.redhat.com/en/topics/cloud-native-apps/stateful-vs-stateless)
- [Client-Side Storage Limitations](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [LocalStorage vs IndexedDB Best Practices](https://dev.to/tene/localstorage-vs-indexeddb-javascript-guide-storage-limits-best-practices-fl5)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or poor user experience but are fixable.

### Pitfall 6: Poor Prompt Engineering Leading to Generic Content

**What goes wrong:**
Vague or poorly structured prompts produce generic, low-value AI content that users could get from any free tool. "Create a Facebook post about my restaurant" → generic "Come visit us!" copy that doesn't reflect business personality, Lithuanian cultural context, or competitive differentiation.

**Why it happens:**
- Vague prompts lead to generic responses (most common AI mistake)
- Lack of context in prompt (business type, tone, audience, goal)
- Not specifying role/perspective for AI
- Insufficient examples/constraints in system prompt
- "Prompt and pray" approach without iteration

**Prevention:**
- Structured prompt templates with clear sections (role, context, constraints, format)
- Include business-specific context: "Family-owned restaurant in Vilnius, traditional Lithuanian cuisine, target audience: locals 25-45"
- Specify tone: "Warm, professional, slightly humorous"
- Few-shot examples in system prompt
- A/B test prompts during development, track quality metrics
- Iterate based on user feedback

**Detection:**
- User feedback: "Content is too generic"
- Low publish rates (users don't use generated content)
- Similar outputs for different business types

**Phase mapping:**
- **Phase 1:** Build baseline prompt templates
- **Phase 2:** Refine based on user testing
- **Phase 3+:** Implement prompt optimization based on production data

**Sources:**
- [Common AI Prompt Mistakes](https://www.godofprompt.ai/blog/common-ai-prompt-mistakes-and-how-to-fix-them)
- [Prompt Engineering Best Practices](https://www.ibm.com/think/prompt-engineering)

---

### Pitfall 7: Image Download and Storage Handling

**What goes wrong:**
DALL-E returns temporary URLs that expire in 1 hour. If user doesn't download image immediately, it's lost. No guidance on how to save images leads to frustration. Large Base64 images in client state cause memory issues.

**Why it happens:**
- DALL-E URLs expire after 60 minutes (security measure)
- No built-in image storage in stateless architecture
- Users expect images to persist like SaaS tools
- Base64 encoding bloats image size ~33%

**Prevention:**
- Download DALL-E images to Blob immediately on generation
- Provide instant download button with filename: "business-post-2026-01-25.png"
- Clear messaging: "Download your image now - link expires in 1 hour"
- Convert to optimal format (JPEG 80% quality for social media)
- Consider temporary S3/Cloudinary storage for session (if budget allows)
- Show image preview with prominent "Download" CTA

**Detection:**
- User complaints: "Where did my image go?"
- High support burden explaining download process
- Images not appearing in generated posts

**Phase mapping:**
- **Phase 1:** Implement auto-download on generation
- **Phase 2:** Add session-based temporary storage if needed
- **Phase 3+:** Consider permanent storage with user accounts

**Sources:**
- [DALL-E Image URL Lifetime](https://community.openai.com/t/dall-e-api-image-url-lifetime/53672)
- [DALL-E to S3 Storage Best Practices](https://medium.com/codex/from-dall-e-2-to-s3-storing-ai-generated-images-in-the-cloud-e8bbc477ee)

---

### Pitfall 8: Kie.ai Proxy Reliability as Single Point of Failure

**What goes wrong:**
Using kie.ai as sole OpenAI proxy creates dependency on third-party service. If kie.ai has downtime, rate limits, or changes pricing, entire tool becomes unavailable. No fallback means 100% service disruption.

**Why it happens:**
- Cost savings (kie.ai 30-50% cheaper than direct OpenAI)
- Simplified billing (kie.ai credits vs. OpenAI usage)
- Assumption that proxy is reliable as original API

**Real-world concerns:**
- Limited user reviews (only 2 Trustpilot reviews as of Dec 2025)
- Customer support accessibility issues reported
- Not officially verified on some directories
- Integration requires technical expertise

**Prevention:**
- Abstract API calls behind service layer (easy provider swap)
- Monitor kie.ai uptime and response times
- Build OpenAI direct API fallback (use in case of kie.ai failure)
- Set timeout thresholds: if kie.ai fails, switch to OpenAI
- Compare costs: kie.ai savings vs. reliability risk
- Keep OpenAI API key funded as backup
- Consider starting with direct OpenAI, migrate to kie.ai after validation

**Detection:**
- Increased 5xx errors from kie.ai endpoints
- Slower response times than expected
- User reports of "service unavailable"
- Cost comparison shows kie.ai savings are marginal

**Phase mapping:**
- **Phase 1:** Start with direct OpenAI for reliability, evaluate kie.ai in Phase 2
- **Phase 2:** A/B test kie.ai proxy, implement fallback logic
- **Phase 3+:** Choose primary provider based on cost/reliability data

**Sources:**
- [Kie.ai Reviews and Reliability](https://www.trustpilot.com/review/kie.ai)
- [Kie.ai Documentation](https://docs.kie.ai)

---

### Pitfall 9: Lack of Streaming Creates Poor UX Perception

**What goes wrong:**
Non-streaming responses force users to stare at blank screen or spinner for 15-30 seconds. No feedback during processing. Users can't tell if tool is working or broken. Research shows this leads to immediate abandonment.

**Why it happens:**
- Simpler to implement: one request, one response
- Assumption that loading spinner is sufficient feedback
- Underestimating user expectations for AI tools in 2026
- Not realizing streaming dramatically improves perceived performance

**Real-world impact:**
- Users find themselves "staring at loading spinners for 5, 10, even up to 40s"
- Token-by-token streaming "makes AI products feel instant, alive, and trustworthy"
- Time to first token drops dramatically with streaming
- Users can interrupt early if they have "enough" information

**Prevention:**
- Implement streaming for text generation (Vercel AI SDK)
- Show progressive updates: "Analyzing business type..." → "Crafting headline..." → "Writing post..."
- Display token-by-token text generation
- Image generation progress: "Creating image (this takes 15-20 seconds)..."
- Allow cancellation if taking too long
- Set expectations: "Generation typically takes 30-60 seconds"

**Detection:**
- High bounce rate on generation page
- Analytics show long session times but no completion
- User feedback: "Is it working?"
- Comparison: competitors feel faster even if they're not

**Phase mapping:**
- **Phase 1:** Implement streaming BEFORE launch (core UX requirement)
- **Phase 2:** Refine progress messaging based on user feedback
- **Phase 3+:** Optimize streaming performance

**Sources:**
- [Streaming AI Responses Best Practices](https://www.9.agency/blog/streaming-ai-responses-vercel-ai-sdk)
- [Streaming vs Non-Streaming UX](https://medium.com/@yrgenkuci/the-streaming-revolution-how-ais-real-time-language-models-are-changing-the-game-d9d0beb18ae2)

---

## Minor Pitfalls

Mistakes that cause annoyance but are easily fixable.

### Pitfall 10: Mobile-First Design Neglect

**What goes wrong:**
Small business owners use phones for everything. Text designed on desktop looks tiny on mobile. Wrong image dimensions get cropped on Instagram. Over 70% of social media consumption is mobile.

**Prevention:**
- Design mobile-first (320px viewport minimum)
- Test on actual phones, not just browser DevTools
- Use responsive image dimensions
- Keep text overlays to 10-15 words maximum
- Test Instagram/Facebook preview rendering

**Phase mapping:** Phase 1 (Foundation) - Mobile-first from day one

---

### Pitfall 11: Insufficient User Onboarding for Non-Technical Users

**What goes wrong:**
Target users (small service providers) don't understand AI tools. Need guidance on what to input, what to expect, how to refine results. Drop off at first screen without onboarding.

**Prevention:**
- Simple onboarding flow: "Tell us about your business in 2-3 sentences"
- Show example inputs: "Kirpykla Vilniuje, modernūs kirpimai, jauna komanda"
- Preview what tool will generate
- Tooltips and helper text throughout
- Video tutorial (30 seconds, Lithuanian)

**Phase mapping:** Phase 2 (MVP) - Add after core functionality works

**Sources:**
- [Small Business AI Adoption Barriers](https://aristeksystems.com/blog/whats-going-on-with-ai-in-2025-and-beyond/)
- [AI Tool User Frustration](https://www.letsgroto.com/blog/ai-ux-design-mistakes)

---

### Pitfall 12: Ignoring Accessibility

**What goes wrong:**
Social media platforms penalize inaccessible content. Generated images need alt text, color contrast must be sufficient, text must be readable.

**Prevention:**
- Auto-generate alt text for images (can use AI)
- Ensure color contrast meets WCAG AA standards
- Copy image text to post caption automatically
- Test with screen readers
- Plain language (8th-grade reading level)

**Phase mapping:** Phase 2 (MVP) - Basic accessibility, improve in Phase 3

**Sources:**
- [Accessible Social Media Best Practices](https://digital-accessibility.northeastern.edu/accessible-social-media/)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation Strategy |
|-------------|---------------|---------------------|
| **Foundation Setup** | Starting with kie.ai proxy without OpenAI fallback | Use direct OpenAI initially, evaluate kie.ai in Phase 2 |
| **API Integration** | No spending limits before first deployment | Set hard OpenAI budget limit and alerts DAY ONE |
| **Text Generation** | Poor Lithuanian quality from default prompts | Test 15+ Lithuanian scenarios, iterate prompts extensively |
| **Image Generation** | DALL-E timeouts on Vercel free tier | Use Vercel Edge Functions (25s timeout) or split into async job |
| **Image Generation** | Content policy violations on Lithuanian prompts | Translate to English before DALL-E, test all business types |
| **Rate Limiting** | No rate limiting allows cost runaway | Implement Vercel KV rate limiting before any public access |
| **UX Implementation** | Non-streaming creates poor perceived performance | Implement streaming from day one, not as "nice to have" |
| **UX Implementation** | Desktop-only design alienates mobile users | Mobile-first design, test on actual devices |
| **MVP Launch** | No usage analytics to guide improvements | Vercel Analytics + error tracking (Sentry) from launch |
| **Post-Launch** | Can't identify why users abandon tool | Add minimal event tracking (generation started, completed, failed) |

---

## Confidence Assessment

**Overall confidence:** MEDIUM

| Area | Confidence | Rationale |
|------|-----------|-----------|
| API Cost Pitfalls | HIGH | Verified with official OpenAI documentation, clear best practices |
| Lithuanian Language | MEDIUM | Official government sources + AI research, but limited production data |
| Vercel Timeouts | HIGH | Official Vercel documentation, community-reported issues |
| DALL-E Content Policy | MEDIUM | Community reports, official FAQ, but unpredictable system behavior |
| No-Database Architecture | MEDIUM | General stateless app research, needs project-specific validation |
| UX/Streaming | HIGH | Verified with Vercel AI SDK docs, UX research consensus |
| Kie.ai Reliability | LOW | Limited public information, few user reviews, needs testing |

---

## Summary: Critical Mitigation Checklist

Before launching MVP, ensure:

- [ ] OpenAI spending limit set to $50/month with email alerts at 50%, 75%, 90%
- [ ] Rate limiting implemented: 5 generations/hour per IP via Vercel KV
- [ ] Lithuanian prompt quality tested with 15+ business scenarios
- [ ] DALL-E prompts translated to English to avoid false positives
- [ ] Streaming implemented for text generation (not optional)
- [ ] Vercel Edge Functions used (25s timeout) OR split text/image into separate calls
- [ ] Image auto-download implemented with clear 1-hour expiration messaging
- [ ] Mobile-first design tested on actual phones
- [ ] Error handling for all API failures (timeouts, content policy, rate limits)
- [ ] Vercel Analytics + error tracking enabled from day one

**Failure to address any of these creates high risk of project failure.**

---

## Sources

### Official Documentation (HIGH confidence)
- [OpenAI API Rate Limiting Best Practices](https://help.openai.com/en/articles/6891753-what-are-the-best-practices-for-managing-my-rate-limits-in-the-api)
- [OpenAI Rate Limits Guide](https://platform.openai.com/docs/guides/rate-limits)
- [OpenAI Error Codes](https://platform.openai.com/docs/guides/error-codes)
- [Vercel Serverless Function Timeouts](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)
- [DALL-E Content Policy FAQ](https://help.openai.com/en/articles/6468065-dall-e-content-policy-faq)
- [Storage API Quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

### Government and Research Sources (MEDIUM-HIGH confidence)
- [Lithuanian AI Language Solutions - €12M Initiative](https://eimin.lrv.lt/en/structure-and-contacts/news-1/eimin-12-million-for-ai-solutions-for-the-lithuanian-language/)
- [Lithuanian Language Technology Challenges](https://tilde.ai/case-study/technology-is-crucial-to-preserve-the-lithuanian-language/)

### Industry Research and Best Practices (MEDIUM confidence)
- [AI Content Generator Common Mistakes](https://doneforyou.com/top-ai-content-mistakes/)
- [Pitfalls of AI-Generated Content](https://beomniscient.com/blog/pitfalls-ai-generated-content/)
- [OpenAI API Cost Tracking](https://www.toriihq.com/articles/how-to-monitor-spending-openai)
- [OpenAI Pricing 2026](https://www.finout.io/blog/openai-pricing-in-2026)
- [Solving Vercel's 10-Second Limit with QStash](https://medium.com/@kolbysisk/case-study-solving-vercels-10-second-limit-with-qstash-2bceeb35d29b)
- [DALL-E Image Generation Mistakes](https://www.allaboutai.com/resources/ai-image-generator-mistakes/)
- [Streaming AI Responses Best Practices](https://www.9.agency/blog/streaming-ai-responses-vercel-ai-sdk)
- [AI UX Design Mistakes](https://www.letsgroto.com/blog/ai-ux-design-mistakes)
- [Small Business AI Adoption Barriers](https://www.deloitte.com/us/en/what-we-do/capabilities/applied-artificial-intelligence/blogs/pulse-check-series-latest-ai-developments/ai-adoption-challenges-ai-trends.html)

### Community Sources (LOW-MEDIUM confidence)
- [DALL-E Content Policy Violations - Community Reports](https://community.openai.com/t/dall-e-falsely-and-repeatedly-claiming-im-breaking-content-policies-pure-lies/468967)
- [DALL-E Non-English Prompt Issues](https://community.openai.com/t/concerns-over-stringent-content-policy-blocks-in-dall-e-3-api-especially-for-non-english-prompts/478274)
- [Kie.ai Reviews](https://www.trustpilot.com/review/kie.ai)
- [LocalStorage Best Practices](https://dev.to/tene/localstorage-vs-indexeddb-javascript-guide-storage-limits-best-practices-fl5)

---

**Research complete. This document provides actionable pitfall identification and prevention strategies for roadmap planning.**
