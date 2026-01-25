# Phase 2: Core Generator - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete text-only post generator with mobile-first UI delivering 60-second workflow. User selects industry, configures settings (tone, emoji, length), generates post text with streaming display, and copies result. Configuration flow and generation display left to Claude's discretion.

</domain>

<decisions>
## Implementation Decisions

### Industry selection
- Search box with autocomplete suggestions as user types
- 10-15 core industries pre-defined (beauty, fitness, restaurants, retail, auto, medical, legal, real estate, etc.)
- Free text fallback if no match found — user can type custom industry
- Remember last selected industry in localStorage, pre-select on return visits

### Output actions
- Copy button shows brief toast notification ("Copied!") that fades after 2 seconds
- Regenerate replaces immediately — old text replaced with new streaming text right away
- No inline editing — text is read-only, user regenerates if not satisfied
- Action buttons (Copy, Regenerate) sticky at bottom of screen for mobile thumb access

### Claude's Discretion
- Configuration flow design (tone/emoji/length settings layout)
- Generation display during streaming (loading states, animation)
- Exact industry list selection for Lithuanian market
- UI layout and visual design details
- Error state handling

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-core-generator*
*Context gathered: 2026-01-25*
