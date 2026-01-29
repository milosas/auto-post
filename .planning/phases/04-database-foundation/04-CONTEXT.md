# Phase 4: Database Foundation - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish database infrastructure for all user-specific features in v2.0. Provision Neon Postgres, configure Drizzle ORM with Edge Runtime compatibility, and define schemas for users, posts, subscriptions, and usage_limits tables.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User delegated all schema design decisions to Claude. Design should be guided by:

1. **Requirements from downstream phases:**
   - Phase 5 (Auth): Users table with Clerk webhook sync
   - Phase 6 (History): Posts table with text, image, generation config
   - Phase 7 (Usage): Usage tracking with daily reset
   - Phase 8 (Payments): Subscriptions and credits

2. **Reasonable defaults:**
   - Soft deletes for user data (recoverable)
   - UTC for timestamps and daily resets (simpler, standard)
   - Store full generation config with posts (enables regenerate feature)
   - JSON columns where flexibility needed (generation parameters)

3. **Edge Runtime constraints:**
   - Use Neon HTTP driver (not TCP)
   - Connection pooling appropriate for serverless

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude to make reasonable infrastructure decisions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-database-foundation*
*Context gathered: 2026-01-29*
