# Milestone v1: Social Post Generator MVP

**Status:** SHIPPED 2026-01-27
**Phases:** 1-3
**Total Plans:** 9

## Overview

This roadmap delivered an AI-powered social media post generator for Lithuanian service providers in three focused phases. Phase 1 established secure API infrastructure with streaming text generation and cost controls. Phase 2 built the complete user workflow from industry selection through post generation and output. Phase 3 added image handling and social media preview capabilities. The entire journey delivered the core value: users can generate professional, industry-appropriate social media posts in under 60 seconds.

## Phases

### Phase 1: Foundation & API

**Goal:** Secure, reliable API infrastructure with streaming text generation and cost protection
**Depends on:** Nothing (first phase)
**Requirements:** INFRA-01, INFRA-02, INFRA-03, GEN-01, GEN-02, GEN-03, GEN-04
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md - Project setup with Next.js 15, AI SDK, and rate limiting infrastructure
- [x] 01-02-PLAN.md - POST /api/generate endpoint with Edge streaming and rate limiting
- [x] 01-03-PLAN.md - Test UI for streaming verification + human checkpoint

**Success Criteria Achieved:**
1. API can generate Lithuanian post text via OpenAI with streaming responses
2. API keys are secured server-side and never exposed to client
3. Rate limiting prevents API cost runaway (hard limits enforced)
4. Generated Lithuanian text is natural and industry-appropriate (verified via test scenarios)
5. Streaming displays text progressively as tokens arrive (not blank screen then dump)

**Completed:** 2026-01-25

### Phase 2: Core Generator

**Goal:** Complete text-only post generator with mobile-first UI delivering 60-second workflow
**Depends on:** Phase 1
**Requirements:** INDS-01, INDS-02, CONF-01, CONF-02, CONF-03, CONF-04, OUT-01, OUT-02, OUT-03, OUT-04, UI-01, UI-02, UI-03, UI-04
**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md - Industry autocomplete with Fuse.js, useLocalStorage hook, industries data
- [x] 02-02-PLAN.md - Post configuration component (tone/emoji/length) + toast notifications setup
- [x] 02-03-PLAN.md - Main page assembly with streaming display, action buttons, mobile layout

**Success Criteria Achieved:**
1. User can select industry and configure post settings (tone, emoji, length) on mobile devices
2. User can generate post text and see it appear progressively with loading states
3. User can copy generated text with one click and see success confirmation
4. User can regenerate text if not satisfied (inline editing deferred to v2)
5. Entire workflow completes in under 60 seconds from landing to copy

**Completed:** 2026-01-26

### Phase 3: Image & Preview

**Goal:** Image upload with social media preview and download capability
**Depends on:** Phase 2
**Requirements:** IMG-01, IMG-02, IMG-03, IMG-04, PREV-01, PREV-02, PREV-03
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md - Image upload component with react-dropzone and DALL-E API endpoint
- [x] 03-02-PLAN.md - Social preview components (Facebook/Instagram) with mobile/desktop toggle
- [x] 03-03-PLAN.md - Main page integration with download functionality

**Success Criteria Achieved:**
1. User can upload image (JPG/PNG/WebP up to 5MB) via drag-drop or file picker
2. User can see uploaded image preview and remove/replace it
3. User can preview complete post in Facebook/Instagram mock format
4. User can toggle preview between mobile and desktop views
5. Preview shows uploaded image combined with generated text in realistic social format

**Completed:** 2026-01-27

---

## Milestone Summary

**Key Decisions:**

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Direct OpenAI for text generation | Simpler setup, kie.ai reserved for image generation | Good |
| Edge Runtime for streaming | 25s timeout vs 10s serverless limit | Good |
| Optional rate limiting | Graceful degradation in development | Good |
| Fuse.js for autocomplete | Typo-tolerant industry search | Good |
| html-to-image for preview export | DOM to PNG/JPEG conversion | Good |
| Parallel text + image generation | Faster UX with Promise.all | Good |
| 20 Lithuanian industry categories | Broad coverage per user feedback | Good |

**Issues Resolved:**

- Switched from kie.ai proxy to direct OpenAI for text generation (simpler)
- Made rate limiting optional for development without Redis
- Expanded industries from 14 to 20 based on user feedback
- Added "Generate image from text" button per user request

**Issues Deferred:**

- OUT-03 inline text editing (user must regenerate for changes)
- DALL-E content policy behavior with Lithuanian prompts unpredictable
- Next.js 15.1.4 security vulnerability (npm warning)

**Technical Debt Incurred:**

- StreamingDisplay is read-only (no inline editing)
- .env.example references KIEAI_API_KEY but implementation uses OPENAI_API_KEY
- Duplicate fixed positioning in ActionButtons (works but redundant CSS)
- Using `<img>` instead of `next/image` (minor performance opportunity)

---

*Archived: 2026-01-27*
*For current project status, see .planning/ROADMAP.md (created for next milestone)*
