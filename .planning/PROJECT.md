# Social Post Generator

## What This Is

A fast, simple tool for small service providers (beauty specialists, trainers, physiotherapists, massage therapists) to create professional Facebook/Instagram posts with AI assistance. Users select their industry, upload or generate an image, configure post settings, and get AI-generated Lithuanian text ready to copy and use.

## Core Value

Users can generate a professional, industry-appropriate social media post in under 60 seconds without any account creation or complex setup.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can select their industry from predefined categories
- [ ] User can upload an image (JPG, PNG, WebP, max 5MB) with drag & drop or click
- [ ] User can generate an AI image using a text prompt
- [ ] User can see pre-made prompt suggestions based on selected industry
- [ ] User can configure post settings (topic, tone, emoji usage, length)
- [ ] User can generate AI-written post text in Lithuanian
- [ ] User can copy generated text with one click
- [ ] User can regenerate post text if not satisfied
- [ ] User can edit generated text inline
- [ ] User can preview post in Facebook/Instagram mock format
- [ ] User can toggle preview between mobile and desktop view
- [ ] App works on mobile devices (responsive design)
- [ ] App shows loading states during AI generation
- [ ] App shows toast notifications for actions (copy success, errors)

### Out of Scope

- User accounts / authentication — MVP is anonymous, no login
- Post scheduling — users copy/paste manually
- Direct posting to social media — requires OAuth complexity
- Analytics / tracking — not needed for MVP
- Templates library — future feature
- Multi-language beyond Lithuanian — LT only for now
- Team collaboration — single-user tool
- Image crop functionality — upload as-is for MVP

## Context

**Target Users:** Lithuanian small service providers who need to post regularly on social media but struggle with content creation. They're busy professionals, not marketers.

**Industry Categories:**
- Grožio specialistai (kirpėjai, kosmetologai, nagų meistrai)
- Treneriai (fitness, joga, personaliniai)
- Kineziterapeutai
- Masažistai
- Kita (custom input)

**Post Settings:**
- Tone: Profesionalus / Draugiškas / Motyvuojantis / Humoristinis
- Emoji: Taip / Ne / Minimaliai
- Length: Trumpas / Vidutinis / Ilgas
- Language: Lithuanian (fixed for MVP)

**Technical Environment:**
- React + Vite + Tailwind CSS frontend
- Vercel deployment with serverless API routes
- OpenAI API via kie.ai proxy for text generation
- DALL-E 3 via OpenAI API for image generation
- No database needed — all client-side state

## Constraints

- **API:** OpenAI via kie.ai proxy — base URL is `https://api.kie.ai/v1`
- **Deployment:** Vercel — affects API route structure (`/api/*.js`)
- **Language:** Lithuanian only — prompts and UI in LT
- **No Auth:** Single page, no user accounts, no persistent storage
- **Image Size:** Max 5MB uploads to keep things fast

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DALL-E 3 over Flux | Same OpenAI API, simpler single integration | — Pending |
| Skip image crop for MVP | Reduces complexity, users can crop before upload | — Pending |
| kie.ai proxy over direct OpenAI | User's existing setup, cost management | — Pending |
| No routing (SPA) | Single flow, no need for pages | — Pending |
| Vercel serverless | Free tier, simple deployment, API routes built-in | — Pending |

---
*Last updated: 2026-01-25 after initialization*
