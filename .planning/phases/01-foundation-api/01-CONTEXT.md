# Phase 1: Foundation & API - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Secure OpenAI integration with streaming text generation and cost controls. This phase delivers the API infrastructure — endpoints that generate Lithuanian social media post text via kie.ai proxy to OpenAI. UI and user workflow come in Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Lithuanian Text Quality
- Default tone: Casual and friendly (like talking to a neighbor, personal feel)
- Terminology: Use Lithuanian equivalents when they exist — prioritize native words even if English terms are common in the industry
- Quality tradeoff: Natural flow first — minor grammar flexibility OK if it sounds more human
- CTAs: Always include a call-to-action in generated posts (contact, visit, book, etc.)

### Rate Limiting & Cost Controls
- Strategy: Daily hard cap only (no per-minute throttling)
- Limit: 50 generations per day total
- When limit reached: Clear message with reset time + contact option ("Need more? Contact us.") — opens future monetization path
- Developer monitoring: Log daily usage counts to monitor trends (review manually)

### Claude's Discretion
- Streaming implementation details
- Error response formatting
- Exact logging/monitoring approach
- API endpoint structure

</decisions>

<specifics>
## Specific Ideas

- Rely on existing kie.ai proxy for OpenAI — no direct OpenAI integration needed
- Cost protection is critical from day one (user mentioned this as a concern)
- Contact option when hitting limits plants seed for future paid tiers

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-api*
*Context gathered: 2026-01-25*
