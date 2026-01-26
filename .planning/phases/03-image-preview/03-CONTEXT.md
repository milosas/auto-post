# Phase 3: Image & Preview - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Image generation (DALL-E) and user upload with social media preview (Facebook, Instagram) and export functionality. Users can generate text and/or images independently, preview how posts will look on social platforms, and download images or previews.

</domain>

<decisions>
## Implementation Decisions

### Image source
- **Both AI generation AND user upload supported**
- Toggle before generation: "Use AI image" / "Upload my own"
- User decides upfront which source to use

### Generation workflow
- Checkboxes: "Generate text" / "Generate image" - user picks one or both
- Both checkboxes checked by default
- Text and image generate independently when selected

### Preview platforms
- Facebook + Instagram previews (two most common for Lithuanian businesses)
- Simplified mock style - recognizable as FB/IG but stylized, not exact UI copy
- Minimal preview content: just image + text in platform frame (no placeholder profiles, reactions, timestamps)

### Preview toggle
- Tab toggle: "Mobile" | "Desktop" - click to switch view
- Not side-by-side display

### Image editing
- No editing capabilities (aligns with MVP decision to skip crop)
- User can replace if not satisfied

### Export options
- Both image download and preview download available (separate options)
- User choice of PNG or JPEG format
- Filenames include industry (e.g., "kirpeja-post.png", "kirpeja-preview.png")

### Claude's Discretion
- Upload method (drag-drop + button vs button-only, mobile-first consideration)
- Error handling for invalid uploads (toast vs inline)
- Image replacement UI (remove + re-add vs overlay button)
- Download button presentation (single menu vs multiple buttons)

</decisions>

<specifics>
## Specific Ideas

- Image should be generated based on the prompt/industry theme - AI creates relevant imagery
- Text and image should be independently re-generatable after initial creation
- Generation flow allows partial generation (just text OR just image)

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 03-image-preview*
*Context gathered: 2026-01-26*
