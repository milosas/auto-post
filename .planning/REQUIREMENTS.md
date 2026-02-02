# Requirements: Social Post Generator v2.0

**Defined:** 2026-01-29
**Core Value:** Transform anonymous tool into SaaS with user accounts, post history, and payments.

## v2.0 Requirements

Requirements for User System + Monetization milestone. Each maps to roadmap phases.

### UX Improvements

- [x] **UX-01**: Industry selector expands full list when clicking on selected industry

### Authentication

- [x] **AUTH-01**: User can sign up with Google OAuth
- [x] **AUTH-02**: User can sign up with email and password
- [x] **AUTH-03**: User can log in with Google OAuth
- [x] **AUTH-04**: User can log in with email and password
- [x] **AUTH-05**: User can reset password via email link
- [x] **AUTH-06**: User receives email verification after signup
- [x] **AUTH-07**: User session persists across browser refresh (remember me)
- [x] **AUTH-08**: User can log out
- [x] **AUTH-09**: User can log in with magic link (passwordless email)

### Post History

- [x] **HIST-01**: Generated posts are saved to database (text + image URL)
- [x] **HIST-02**: User can view list of saved posts (date, thumbnail, text preview)
- [x] **HIST-03**: User can view individual post details (full text + image)
- [x] **HIST-04**: User can copy text from saved post
- [x] **HIST-05**: User can regenerate post from saved configuration
- [x] **HIST-06**: User can search posts by text content
- [x] **HIST-07**: User can mark posts as favorites
- [x] **HIST-08**: User can view favorite posts separately

### Usage & Limits

- [x] **USAGE-01**: Free users limited to 3 generations per day
- [x] **USAGE-02**: Usage counter displays "X/3 used today"
- [x] **USAGE-03**: Usage resets daily at midnight in user's timezone (improved from UTC)
- [x] **USAGE-04**: Generate button hidden when daily limit reached (replaced with upgrade CTA)
- [x] **USAGE-05**: Upgrade CTA shown when limit reached (inline, not modal)

### Payments

- [x] **PAY-01**: User can subscribe via Stripe Checkout (monthly plan)
- [x] **PAY-02**: Subscribed users have unlimited generations
- [x] **PAY-03**: User can update payment method via Stripe Customer Portal
- [x] **PAY-04**: User can cancel subscription via Stripe Customer Portal
- [x] **PAY-05**: Stripe webhooks handle subscription events (created, canceled, failed)
- [x] **PAY-06**: User can purchase credits as alternative to subscription
- [x] **PAY-07**: Credits deducted per generation for credit users
- [x] **PAY-08**: User can view credit balance

### Dashboard

- [x] **DASH-01**: User sees dashboard after login
- [x] **DASH-02**: Dashboard shows usage stats (generations today, total saved)
- [x] **DASH-03**: Dashboard shows subscription/credit status
- [x] **DASH-04**: Dashboard provides quick access to generate new post

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
| UX-01 | Phase 9 | Complete |
| AUTH-01 | Phase 5 | Complete |
| AUTH-02 | Phase 5 | Complete |
| AUTH-03 | Phase 5 | Complete |
| AUTH-04 | Phase 5 | Complete |
| AUTH-05 | Phase 5 | Complete |
| AUTH-06 | Phase 5 | Complete |
| AUTH-07 | Phase 5 | Complete |
| AUTH-08 | Phase 5 | Complete |
| AUTH-09 | Phase 5 | Complete |
| HIST-01 | Phase 6 | Complete |
| HIST-02 | Phase 6 | Complete |
| HIST-03 | Phase 6 | Complete |
| HIST-04 | Phase 6 | Complete |
| HIST-05 | Phase 6 | Complete |
| HIST-06 | Phase 6 | Complete |
| HIST-07 | Phase 6 | Complete |
| HIST-08 | Phase 6 | Complete |
| USAGE-01 | Phase 7 | Complete |
| USAGE-02 | Phase 7 | Complete |
| USAGE-03 | Phase 7 | Complete |
| USAGE-04 | Phase 7 | Complete |
| USAGE-05 | Phase 7 | Complete |
| PAY-01 | Phase 8 | Complete |
| PAY-02 | Phase 8 | Complete |
| PAY-03 | Phase 8 | Complete |
| PAY-04 | Phase 8 | Complete |
| PAY-05 | Phase 8 | Complete |
| PAY-06 | Phase 8 | Complete |
| PAY-07 | Phase 8 | Complete |
| PAY-08 | Phase 8 | Complete |
| DASH-01 | Phase 9 | Complete |
| DASH-02 | Phase 9 | Complete |
| DASH-03 | Phase 9 | Complete |
| DASH-04 | Phase 9 | Complete |

**Coverage:**
- v2.0 requirements: 35 total
- Mapped to phases: 35/35 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-02-02 - All v2.0 requirements complete*
