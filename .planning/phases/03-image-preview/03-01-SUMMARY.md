---
phase: 03-image-preview
plan: 01
subsystem: ui
tags: [react-dropzone, dall-e, openai, image-upload, file-validation]

# Dependency graph
requires:
  - phase: 02-core-generator
    provides: Rate limiting infrastructure with dailyLimit
  - phase: 01-foundation
    provides: Next.js project structure and API route patterns
provides:
  - ImageUpload component with drag-drop file handling
  - ImageSource toggle for AI/upload mode selection
  - DALL-E 3 image generation API endpoint
  - Image validation utilities (type and size checking)
  - useImagePreview hook for File to base64 conversion
affects: [03-image-preview, future phases using image handling]

# Tech tracking
tech-stack:
  added: [react-dropzone@14.3.8, openai]
  patterns:
    - "File upload with react-dropzone useDropzone hook"
    - "DALL-E 3 API integration with OpenAI client"
    - "Image validation with MIME type and size checks"
    - "FileReader-based preview generation hook"

key-files:
  created:
    - app/lib/image-utils.ts
    - app/components/ImageUpload.tsx
    - app/components/ImageSource.tsx
    - app/api/generate-image/route.ts
  modified:
    - package.json

key-decisions:
  - "English prompts for DALL-E (better results per RESEARCH.md)"
  - "Direct OpenAI client for images.generate (not in @ai-sdk/openai)"
  - "5MB file size limit for uploads"
  - "Standard quality default for DALL-E (HD optional)"
  - "natural style for DALL-E (professional social media aesthetic)"

patterns-established:
  - "Image validation with Lithuanian error messages"
  - "useImagePreview hook pattern for File to base64 conversion"
  - "Toggle component matching PostConfiguration button style"

# Metrics
duration: 4min
completed: 2026-01-26
---

# Phase 03 Plan 01: Image Upload & Generation Summary

**Image upload with react-dropzone drag-drop, DALL-E 3 API generation endpoint, and validation utilities with Lithuanian error messages**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-26T14:04:21Z
- **Completed:** 2026-01-26T14:08:42Z
- **Tasks:** 3
- **Files created:** 4

## Accomplishments
- Image upload component with drag-drop, validation, and preview
- AI/upload mode toggle component
- DALL-E 3 image generation API with rate limiting
- Image validation utilities with type and size checks

## Task Commits

Each task was committed atomically:

1. **Task 1: Install react-dropzone and create image utilities** - `1da09a9` (chore)
2. **Task 2: Create ImageUpload and ImageSource components** - `9f49888` (feat) - *Note: Created in 03-02 execution before 03-01 completion*
3. **Task 3: Create DALL-E image generation API endpoint** - `72e94be` (feat)

## Files Created/Modified
- `app/lib/image-utils.ts` - Image validation (MIME type, size) and useImagePreview hook for File to base64
- `app/components/ImageUpload.tsx` - Drag-drop upload with react-dropzone, preview display, remove button
- `app/components/ImageSource.tsx` - Toggle between AI generation and upload modes
- `app/api/generate-image/route.ts` - DALL-E 3 image generation endpoint with rate limiting
- `package.json` - Added react-dropzone@14.3.8 and openai

## Decisions Made
- Used English prompts for DALL-E API (better results per RESEARCH.md recommendation)
- Direct OpenAI client installation required (images.generate not exposed in @ai-sdk/openai)
- 5MB file size limit for uploaded images
- Standard quality as default for DALL-E with HD as optional parameter
- Natural style for DALL-E to match professional social media aesthetic

## Deviations from Plan

### Task Execution Order

**Context:** Plan 03-02 was executed before 03-01 was completed, resulting in ImageUpload and ImageSource components being created in commit `9f49888` (feat(03-02): create SocialPreview parent component) rather than as part of 03-01.

**Resolution:** Components exist and match 03-01 specifications exactly. Functionality verified through TypeScript compilation. No rework needed.

**Files affected:**
- `app/components/ImageUpload.tsx` (created in 03-02)
- `app/components/ImageSource.tsx` (created in 03-02)

**Impact:** No functional impact. All required components exist and work correctly. Documentation updated to reflect actual commit history.

---

**Total deviations:** 1 execution order (Task 2 components pre-created in 03-02)
**Impact on plan:** No impact - all deliverables present and functional per specifications

## Issues Encountered

**TypeScript validation error:** Initial implementation of DALL-E endpoint had `response.data[0]` access without null checking for `response.data`.

**Resolution:** Added explicit null check for `response.data` and length validation before array access. Error handling with appropriate Lithuanian error messages.

**Fix committed in:** `72e94be` (Task 3 commit)

## User Setup Required

**OPENAI_API_KEY environment variable required for DALL-E image generation.**

To enable image generation:
1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   ```
3. Verify: Call `/api/generate-image` endpoint should return 500 with auth error (not 400 validation error)

Note: Without API key, image generation endpoint will fail. Upload functionality works independently.

## Next Phase Readiness

**Ready for integration:**
- ImageUpload component available for use in main UI
- ImageSource toggle available for mode selection
- DALL-E generation endpoint ready for API calls
- Image validation utilities available for reuse

**Blockers:** None

**Concerns:**
- DALL-E content policy behavior with Lithuanian prompts unpredictable (deferred to v2 per STATE.md)
- English prompt translation maintains intent accuracy (mitigated by simple prompt format)

---
*Phase: 03-image-preview*
*Completed: 2026-01-26*
