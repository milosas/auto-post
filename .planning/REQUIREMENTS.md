# Requirements: Social Post Generator v2.0

**Defined:** 2026-01-29
**Core Value:** Transform anonymous tool into SaaS with user accounts, post history, and payments.

## v2.0 Requirements

Requirements for User System + Monetization milestone. Each maps to roadmap phases.

### UX Improvements

- [ ] **UX-01**: Industry selector expands full list when clicking on selected industry

### Authentication

- [ ] **AUTH-01**: User can sign up with Google OAuth
- [ ] **AUTH-02**: User can sign up with email and password
- [ ] **AUTH-03**: User can log in with Google OAuth
- [ ] **AUTH-04**: User can log in with email and password
- [ ] **AUTH-05**: User can reset password via email link
- [ ] **AUTH-06**: User receives email verification after signup
- [ ] **AUTH-07**: User session persists across browser refresh (remember me)
- [ ] **AUTH-08**: User can log out
- [ ] **AUTH-09**: User can log in with magic link (passwordless email)

### Post History

- [ ] **HIST-01**: Generated posts are saved to database (text + image URL)
- [ ] **HIST-02**: User can view list of saved posts (date, thumbnail, text preview)
- [ ] **HIST-03**: User can view individual post details (full text + image)
- [ ] **HIST-04**: User can copy text from saved post
- [ ] **HIST-05**: User can regenerate post from saved configuration
- [ ] **HIST-06**: User can search posts by text content
- [ ] **HIST-07**: User can mark posts as favorites
- [ ] **HIST-08**: User can view favorite posts separately

### Usage & Limits

- [ ] **USAGE-01**: Free users limited to 3 generations per day
- [ ] **USAGE-02**: Usage counter displays "X/3 used today"
- [ ] **USAGE-03**: Usage resets daily at midnight UTC
- [ ] **USAGE-04**: Generate button disabled when daily limit reached
- [ ] **USAGE-05**: Upgrade prompt modal shown when limit reached

### Payments

- [ ] **PAY-01**: User can subscribe via Stripe Checkout (monthly plan)
- [ ] **PAY-02**: Subscribed users have unlimited generations
- [ ] **PAY-03**: User can update payment method via Stripe Customer Portal
- [ ] **PAY-04**: User can cancel subscription via Stripe Customer Portal
- [ ] **PAY-05**: Stripe webhooks handle subscription events (created, canceled, failed)
- [ ] **PAY-06**: User can purchase credits as alternative to subscription
- [ ] **PAY-07**: Credits deducted per generation for credit users
- [ ] **PAY-08**: User can view credit balance

### Dashboard

- [ ] **DASH-01**: User sees dashboard after login
- [ ] **DASH-02**: Dashboard shows usage stats (generations today, total saved)
- [ ] **DASH-03**: Dashboard shows subscription/credit status
- [ ] **DASH-04**: Dashboard provides quick access to generate new post

## Future Requirements (v2.1+)

Deferred to future milestone. Tracked but not in current roadmap.

### Authentication

- **AUTH-10**: User can sign up/login with Facebook OAuth
- **AUTH-11**: Account deletion with data removal (GDPR)
- **AUTH-12**: Multi-device session management

### History

- **HIST-09**: Filter posts by industry
- **HIST-10**: Filter posts by date range
- **HIST-11**: Export history as CSV/JSON
- **HIST-12**: Download post as image

### Payments

- **PAY-09**: Annual billing with discount
- **PAY-10**: Usage alerts via email (80% quota used)
- **PAY-11**: Credit rollover to next month

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Two-factor authentication (2FA) | Overkill for content tool, adds friction |
| Enterprise SSO (SAML) | Target is SMBs, not enterprises |
| Team collaboration | Single-user tool, no team features needed |
| Post scheduling | Different product category (Buffer/Hootsuite) |
| Direct social media posting | API maintenance burden, copy-paste works |
| Post analytics | We generate content, not track performance |
| Version history per post | Users regenerate instead of version control |
| Folders/nested organization | Flat list with search is sufficient |
| Tiered pricing with feature gates | Too complex, single paid tier preferred |
| Cryptocurrency payments | Niche demand, adds complexity |
| Lifetime deals | Unsustainable, kills MRR |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UX-01 | Phase 9 | Pending |
| AUTH-01 | Phase 5 | Pending |
| AUTH-02 | Phase 5 | Pending |
| AUTH-03 | Phase 5 | Pending |
| AUTH-04 | Phase 5 | Pending |
| AUTH-05 | Phase 5 | Pending |
| AUTH-06 | Phase 5 | Pending |
| AUTH-07 | Phase 5 | Pending |
| AUTH-08 | Phase 5 | Pending |
| AUTH-09 | Phase 5 | Pending |
| HIST-01 | Phase 6 | Pending |
| HIST-02 | Phase 6 | Pending |
| HIST-03 | Phase 6 | Pending |
| HIST-04 | Phase 6 | Pending |
| HIST-05 | Phase 6 | Pending |
| HIST-06 | Phase 6 | Pending |
| HIST-07 | Phase 6 | Pending |
| HIST-08 | Phase 6 | Pending |
| USAGE-01 | Phase 7 | Pending |
| USAGE-02 | Phase 7 | Pending |
| USAGE-03 | Phase 7 | Pending |
| USAGE-04 | Phase 7 | Pending |
| USAGE-05 | Phase 7 | Pending |
| PAY-01 | Phase 8 | Pending |
| PAY-02 | Phase 8 | Pending |
| PAY-03 | Phase 8 | Pending |
| PAY-04 | Phase 8 | Pending |
| PAY-05 | Phase 8 | Pending |
| PAY-06 | Phase 8 | Pending |
| PAY-07 | Phase 8 | Pending |
| PAY-08 | Phase 8 | Pending |
| DASH-01 | Phase 9 | Pending |
| DASH-02 | Phase 9 | Pending |
| DASH-03 | Phase 9 | Pending |
| DASH-04 | Phase 9 | Pending |

**Coverage:**
- v2.0 requirements: 35 total
- Mapped to phases: 35/35 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-01-29 after roadmap creation*
