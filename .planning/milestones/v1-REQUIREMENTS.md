# Requirements Archive: v1 Social Post Generator MVP

**Archived:** 2026-01-27
**Status:** SHIPPED

This is the archived requirements specification for v1.
For current requirements, see `.planning/REQUIREMENTS.md` (created for next milestone).

---

# Requirements: Social Post Generator

**Defined:** 2026-01-25
**Core Value:** Users can generate a professional, industry-appropriate social media post in under 60 seconds

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Industry Selection

- [x] **INDS-01**: User can select industry from dropdown (Grožio specialistai, Treneriai, Kineziterapeutai, Masažistai, Kita)
- [x] **INDS-02**: User can enter custom industry text when selecting "Kita"

### Image Handling

- [x] **IMG-01**: User can upload image via drag & drop or click to browse
- [x] **IMG-02**: User can see preview of uploaded image
- [x] **IMG-03**: System accepts JPG, PNG, WebP formats up to 5MB
- [x] **IMG-04**: User can remove/replace uploaded image

### Post Configuration

- [x] **CONF-01**: User can enter post topic or goal (text input)
- [x] **CONF-02**: User can select tone (Profesionalus / Draugiškas / Motyvuojantis / Humoristinis)
- [x] **CONF-03**: User can configure emoji usage (Taip / Ne / Minimaliai)
- [x] **CONF-04**: User can select post length (Trumpas / Vidutinis / Ilgas)

### AI Generation

- [x] **GEN-01**: User can generate post text by clicking Generate button
- [x] **GEN-02**: User sees text appear progressively (streaming)
- [x] **GEN-03**: User sees loading state during generation
- [x] **GEN-04**: Generated text is natural Lithuanian appropriate for selected industry

### Output

- [x] **OUT-01**: User can copy generated text with one click
- [x] **OUT-02**: User can regenerate text if not satisfied
- [ ] **OUT-03**: User can edit generated text inline *(PARTIAL - deferred to v2)*
- [x] **OUT-04**: User sees success toast after copying

### Preview

- [x] **PREV-01**: User can see post in mock Facebook/Instagram format
- [x] **PREV-02**: User can toggle preview between mobile and desktop view
- [x] **PREV-03**: Preview shows uploaded image with generated text

### UI/UX

- [x] **UI-01**: App works on mobile devices (responsive design)
- [x] **UI-02**: App shows toast notifications for actions (copy, errors)
- [x] **UI-03**: App is single page with no navigation required
- [x] **UI-04**: App shows clear loading/skeleton states

### Infrastructure

- [x] **INFRA-01**: API routes secured (no exposed API keys)
- [x] **INFRA-02**: Rate limiting prevents API cost runaway
- [x] **INFRA-03**: Edge Functions handle generation (25s timeout vs 10s serverless)

## v2 Requirements (Deferred)

Tracked for future release. Not in v1 scope.

### Image Generation

- **IMGGEN-01**: User can generate AI image using text prompt *(Delivered in v1 as bonus feature)*
- **IMGGEN-02**: User sees industry-specific prompt suggestions
- **IMGGEN-03**: User can regenerate image if not satisfied

### Templates

- **TMPL-01**: User can select from industry-specific post templates
- **TMPL-02**: Templates include: Before/After, Client Testimonial, Tip of the Day, Treatment Spotlight

### Enhancements

- **ENH-01**: User sees auto-suggested hashtags (3-5)
- **ENH-02**: User can select platform (Facebook vs Instagram) for optimized output
- **ENH-03**: App suggests seasonal/holiday relevant content

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / authentication | MVP is anonymous - reduces friction, faster to ship |
| Post scheduling | Massive complexity (OAuth, cron); users can schedule in FB/IG natively |
| Direct publishing to platforms | Requires platform APIs, auth flows; copy-paste works everywhere |
| Analytics dashboard | Users have native platform analytics; duplicating adds bloat |
| Team collaboration | Target users are solo practitioners |
| Content calendar | Users post reactively, not planning weeks ahead |
| Multi-language beyond Lithuanian | LT only for v1; validate market first |
| Image crop functionality | Users can crop before upload; reduces complexity |
| Hashtag research tools | Hashtags declining (IG limits to 5); auto-suggest sufficient for v2 |
| A/B testing | Too sophisticated for target market |

## Traceability

Which phases covered which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INDS-01 | Phase 2 | Complete |
| INDS-02 | Phase 2 | Complete |
| IMG-01 | Phase 3 | Complete |
| IMG-02 | Phase 3 | Complete |
| IMG-03 | Phase 3 | Complete |
| IMG-04 | Phase 3 | Complete |
| CONF-01 | Phase 2 | Complete |
| CONF-02 | Phase 2 | Complete |
| CONF-03 | Phase 2 | Complete |
| CONF-04 | Phase 2 | Complete |
| GEN-01 | Phase 1 | Complete |
| GEN-02 | Phase 1 | Complete |
| GEN-03 | Phase 1 | Complete |
| GEN-04 | Phase 1 | Complete |
| OUT-01 | Phase 2 | Complete |
| OUT-02 | Phase 2 | Complete |
| OUT-03 | Phase 2 | **Partial** (deferred) |
| OUT-04 | Phase 2 | Complete |
| PREV-01 | Phase 3 | Complete |
| PREV-02 | Phase 3 | Complete |
| PREV-03 | Phase 3 | Complete |
| UI-01 | Phase 2 | Complete |
| UI-02 | Phase 2 | Complete |
| UI-03 | Phase 2 | Complete |
| UI-04 | Phase 2 | Complete |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 28 total
- Complete: 27
- Partial: 1 (OUT-03 inline editing)

---

## Milestone Summary

**Shipped:** 27 of 28 v1 requirements (96%)

**Adjusted:** None - all requirements delivered as specified

**Partial:**
- OUT-03 (Inline text editing) - StreamingDisplay renders read-only text. Users must regenerate entire post for changes. Deferred to v2 backlog.

**Dropped:** None

**Bonus Feature Delivered:**
- AI image generation (IMGGEN-01) originally planned for v2 was implemented in v1 Phase 3

---

*Archived: 2026-01-27 as part of v1 milestone completion*
