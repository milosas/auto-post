# Social Post Generator

## Current State

**Shipped:** v1 MVP (2026-01-27)
**Status:** Production-ready, awaiting deployment

**What v1 delivers:**
- AI-powered post generator for Lithuanian service providers
- 20 industry categories with fuzzy autocomplete
- Streaming text generation with visual feedback
- Image upload (drag-drop) and DALL-E AI generation
- Facebook/Instagram social preview
- Multi-format download (PNG/JPEG)
- Complete 60-second workflow from landing to download

## What This Is

A fast, simple tool for small service providers (beauty specialists, trainers, physiotherapists, massage therapists) to create professional Facebook/Instagram posts with AI assistance. Users select their industry, upload or generate an image, configure post settings, and get AI-generated Lithuanian text ready to copy and use.

## Core Value

Users can generate a professional, industry-appropriate social media post in under 60 seconds without any account creation or complex setup.

## Requirements

### Validated

- Industry selection with 20 Lithuanian categories — v1
- Image upload (JPG/PNG/WebP, max 5MB) with drag & drop — v1
- AI image generation via DALL-E with "generate from text" — v1
- Post configuration (topic, tone, emoji, length) — v1
- Streaming text generation in Lithuanian — v1
- One-click copy with toast confirmation — v1
- Regenerate text functionality — v1
- Facebook/Instagram mock preview — v1
- Mobile/desktop preview toggle — v1
- Responsive mobile-first design — v1
- Loading states during AI generation — v1
- Toast notifications for actions — v1
- Secured API keys (server-side only) — v1
- Rate limiting for cost protection — v1

### Active

(None — awaiting user feedback from v1 deployment)

### Out of Scope

- User accounts / authentication — MVP is anonymous, no login
- Post scheduling — users copy/paste manually
- Direct posting to social media — requires OAuth complexity
- Analytics / tracking — not needed for MVP
- Templates library — future feature (v2)
- Multi-language beyond Lithuanian — LT only for now
- Team collaboration — single-user tool
- Image crop functionality — upload as-is
- Inline text editing — user regenerates instead (tech debt from v1)

## Context

**Shipped:** v1 MVP with 1,768 LOC TypeScript across 22 source files.

**Tech stack:**
- Next.js 15 with Edge Runtime
- OpenAI API for streaming text generation
- DALL-E 3 for AI image generation
- Upstash Redis for rate limiting (optional)
- Fuse.js for industry autocomplete
- html-to-image for preview export
- react-dropzone for image upload
- react-hot-toast for notifications

**Target Users:** Lithuanian small service providers who need to post regularly on social media but struggle with content creation. They're busy professionals, not marketers.

**Industry Categories (20):**
Grožio specialistai, Treneriai, Kineziterapeutai, Masažistai, Psichologai, Fotografai, Floristai, Renginių organizatoriai, Virtuvės šefai, Interjero dizaineriai, Nekilnojamo turto agentai, Veterinarai, Buhalteriai, Teisininkai, Programuotojai, Dizaineriai, Konditeriai, Korepetitoriai, Valymo paslaugos, Kita

## Constraints

- **API:** OpenAI direct API for text generation
- **Deployment:** Vercel with Edge Runtime
- **Language:** Lithuanian only
- **No Auth:** Single page, no user accounts
- **Image Size:** Max 5MB uploads

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Direct OpenAI for text generation | Simpler setup than proxy | Good |
| Edge Runtime for streaming | 25s timeout vs 10s serverless | Good |
| Optional rate limiting | Graceful degradation in dev | Good |
| DALL-E 3 over Flux | Same OpenAI API, simpler integration | Good |
| Skip image crop | Users can crop before upload | Good |
| No routing (SPA) | Single flow, no need for pages | Good |
| Fuse.js for autocomplete | Typo-tolerant industry search | Good |
| html-to-image for export | DOM to PNG/JPEG conversion | Good |
| 20 industry categories | Broad coverage per user feedback | Good |

## Tech Debt

Tracked for future cleanup:

- **OUT-03:** Inline text editing not implemented — user must regenerate entire post
- **.env.example:** References KIEAI_API_KEY but implementation uses OPENAI_API_KEY
- **Duplicate CSS:** ActionButtons has both fixed positioning and is wrapped in fixed div
- **Image optimization:** Using `<img>` instead of `next/image`

---
*Last updated: 2026-01-27 after v1 milestone completion*
