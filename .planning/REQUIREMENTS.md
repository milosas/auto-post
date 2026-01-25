# Requirements: Social Post Generator

**Defined:** 2026-01-25
**Core Value:** Users can generate a professional, industry-appropriate social media post in under 60 seconds

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Industry Selection

- [ ] **INDS-01**: User can select industry from dropdown (Grožio specialistai, Treneriai, Kineziterapeutai, Masažistai, Kita)
- [ ] **INDS-02**: User can enter custom industry text when selecting "Kita"

### Image Handling

- [ ] **IMG-01**: User can upload image via drag & drop or click to browse
- [ ] **IMG-02**: User can see preview of uploaded image
- [ ] **IMG-03**: System accepts JPG, PNG, WebP formats up to 5MB
- [ ] **IMG-04**: User can remove/replace uploaded image

### Post Configuration

- [ ] **CONF-01**: User can enter post topic or goal (text input)
- [ ] **CONF-02**: User can select tone (Profesionalus / Draugiškas / Motyvuojantis / Humoristinis)
- [ ] **CONF-03**: User can configure emoji usage (Taip / Ne / Minimaliai)
- [ ] **CONF-04**: User can select post length (Trumpas / Vidutinis / Ilgas)

### AI Generation

- [ ] **GEN-01**: User can generate post text by clicking Generate button
- [ ] **GEN-02**: User sees text appear progressively (streaming)
- [ ] **GEN-03**: User sees loading state during generation
- [ ] **GEN-04**: Generated text is natural Lithuanian appropriate for selected industry

### Output

- [ ] **OUT-01**: User can copy generated text with one click
- [ ] **OUT-02**: User can regenerate text if not satisfied
- [ ] **OUT-03**: User can edit generated text inline
- [ ] **OUT-04**: User sees success toast after copying

### Preview

- [ ] **PREV-01**: User can see post in mock Facebook/Instagram format
- [ ] **PREV-02**: User can toggle preview between mobile and desktop view
- [ ] **PREV-03**: Preview shows uploaded image with generated text

### UI/UX

- [ ] **UI-01**: App works on mobile devices (responsive design)
- [ ] **UI-02**: App shows toast notifications for actions (copy, errors)
- [ ] **UI-03**: App is single page with no navigation required
- [ ] **UI-04**: App shows clear loading/skeleton states

### Infrastructure

- [ ] **INFRA-01**: API routes secured (no exposed API keys)
- [ ] **INFRA-02**: Rate limiting prevents API cost runaway
- [ ] **INFRA-03**: Edge Functions handle generation (25s timeout vs 10s serverless)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Image Generation

- **IMGGEN-01**: User can generate AI image using text prompt
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

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INDS-01 | Phase 2 | Pending |
| INDS-02 | Phase 2 | Pending |
| IMG-01 | Phase 3 | Pending |
| IMG-02 | Phase 3 | Pending |
| IMG-03 | Phase 3 | Pending |
| IMG-04 | Phase 3 | Pending |
| CONF-01 | Phase 2 | Pending |
| CONF-02 | Phase 2 | Pending |
| CONF-03 | Phase 2 | Pending |
| CONF-04 | Phase 2 | Pending |
| GEN-01 | Phase 1 | Complete |
| GEN-02 | Phase 1 | Complete |
| GEN-03 | Phase 1 | Complete |
| GEN-04 | Phase 1 | Complete |
| OUT-01 | Phase 2 | Pending |
| OUT-02 | Phase 2 | Pending |
| OUT-03 | Phase 2 | Pending |
| OUT-04 | Phase 2 | Pending |
| PREV-01 | Phase 3 | Pending |
| PREV-02 | Phase 3 | Pending |
| PREV-03 | Phase 3 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 2 | Pending |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-25*
*Last updated: 2026-01-25 after Phase 1 completion (7 requirements complete)*
