# Roadmap: Social Post Generator

## Overview

This roadmap delivers an AI-powered social media post generator for Lithuanian service providers in three focused phases. Phase 1 establishes secure API infrastructure with streaming text generation and cost controls. Phase 2 builds the complete user workflow from industry selection through post generation and output. Phase 3 adds image handling and social media preview capabilities. The entire journey delivers the core value: users can generate professional, industry-appropriate social media posts in under 60 seconds.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & API** - Secure OpenAI integration with streaming, rate limiting, and cost controls ✓
- [ ] **Phase 2: Core Generator** - Complete text-only post generator workflow with mobile-first UI
- [ ] **Phase 3: Image & Preview** - Image upload, social media preview, and export functionality

## Phase Details

### Phase 1: Foundation & API
**Goal**: Secure, reliable API infrastructure with streaming text generation and cost protection
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, GEN-01, GEN-02, GEN-03, GEN-04
**Success Criteria** (what must be TRUE):
  1. API can generate Lithuanian post text via OpenAI with streaming responses
  2. API keys are secured server-side and never exposed to client
  3. Rate limiting prevents API cost runaway (hard limits enforced)
  4. Generated Lithuanian text is natural and industry-appropriate (verified via test scenarios)
  5. Streaming displays text progressively as tokens arrive (not blank screen then dump)
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md - Project setup with Next.js 15, AI SDK, and rate limiting infrastructure ✓
- [x] 01-02-PLAN.md - POST /api/generate endpoint with Edge streaming and rate limiting ✓
- [x] 01-03-PLAN.md - Test UI for streaming verification + human checkpoint ✓

### Phase 2: Core Generator
**Goal**: Complete text-only post generator with mobile-first UI delivering 60-second workflow
**Depends on**: Phase 1
**Requirements**: INDS-01, INDS-02, CONF-01, CONF-02, CONF-03, CONF-04, OUT-01, OUT-02, OUT-03, OUT-04, UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. User can select industry and configure post settings (tone, emoji, length) on mobile devices
  2. User can generate post text and see it appear progressively with loading states
  3. User can copy generated text with one click and see success confirmation
  4. User can regenerate or edit text inline if not satisfied
  5. Entire workflow completes in under 60 seconds from landing to copy
**Plans**: TBD

Plans:
- [ ] 02-01: TBD during planning
- [ ] 02-02: TBD during planning

### Phase 3: Image & Preview
**Goal**: Image upload with social media preview and download capability
**Depends on**: Phase 2
**Requirements**: IMG-01, IMG-02, IMG-03, IMG-04, PREV-01, PREV-02, PREV-03
**Success Criteria** (what must be TRUE):
  1. User can upload image (JPG/PNG/WebP up to 5MB) via drag-drop or file picker
  2. User can see uploaded image preview and remove/replace it
  3. User can preview complete post in Facebook/Instagram mock format
  4. User can toggle preview between mobile and desktop views
  5. Preview shows uploaded image combined with generated text in realistic social format
**Plans**: TBD

Plans:
- [ ] 03-01: TBD during planning
- [ ] 03-02: TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & API | 3/3 | ✓ Complete | 2026-01-25 |
| 2. Core Generator | 0/TBD | Ready to plan | - |
| 3. Image & Preview | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-25*
*Last updated: 2026-01-25 after Phase 1 completion*
