# Features Research: v2.0 User System + Payments

**Project:** Social Post Generator for Lithuanian Service Providers
**Research Date:** 2026-01-29
**Focus:** Authentication, Post History, Payment Systems for Content Generation SaaS
**Confidence:** MEDIUM (based on ecosystem research, competitor analysis, official Stripe docs)

---

## Authentication Features

### Table Stakes (Must-Have for Credibility)

| Feature | Complexity | Notes | Rationale |
|---------|-----------|-------|-----------|
| **Social login (Google, Facebook)** | Low-Medium | Use Stripe Identity or Auth0 for implementation | 75% of users abandon without frictionless registration. Miro only asks for email + allows Google/Microsoft/Slack login |
| **Email/password authentication** | Medium | Requires password reset flow, email verification | Fallback for users who don't trust social login. Security baseline requirement |
| **Password reset via email** | Low | Magic link or temporary password | Standard expectation - users will immediately test this if they forget password |
| **Email verification** | Low | Prevent spam accounts, one-time link | Table stakes for any serious SaaS - prevents fake accounts |
| **Remember me / session persistence** | Low | 7-30 day sessions common | Users expect to stay logged in on trusted devices |
| **Logout functionality** | Low | Clear session, redirect to login | Basic security requirement |

### Differentiators (Nice-to-Have, Sets Product Apart)

| Feature | Complexity | Notes | Value Proposition |
|---------|-----------|-------|-------------------|
| **Passwordless login (magic link)** | Medium | Email-only authentication, no password storage | Modern, secure alternative - reduces password fatigue. Used by Notion, Slack |
| **Social login profile import** | Low | Pull name/avatar from Google/FB on first login | Personalized dashboard immediately - better first impression |
| **Account deletion** | Medium | GDPR compliance, cascade delete all user data | Legal requirement for EU/Lithuanian users, builds trust |
| **Multi-device session management** | Medium | See all active sessions, remote logout | Security-conscious users appreciate visibility |

### Anti-Features (Deliberately NOT Building)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Two-factor authentication (2FA)** | Overkill for content generation tool. Adds friction without meaningful security benefit for this use case | Focus on secure social login and magic links instead |
| **Enterprise SSO (SAML, LDAP)** | Target audience is small Lithuanian businesses, not enterprises. 99% won't use it | Wait for explicit B2B customer demand |
| **Passwordless SMS login** | Expensive (SMS costs), unreliable in some regions, introduces phone number dependency | Use email magic links for passwordless experience |
| **Multiple account types/roles** | Adds complexity without value for single-user tool | Keep it simple - one user = one account |
| **Username system** | Unnecessary - email serves as unique identifier | Use email as primary identifier |

---

## History/Dashboard Features

### Table Stakes (Must-Have for Credibility)

| Feature | Complexity | Notes | Rationale |
|---------|-----------|-------|-----------|
| **Post history list view** | Low | Show all generated posts, newest first | Core value prop - users expect to retrieve past work. Jasper saves all generated content history |
| **Post thumbnail preview** | Medium | Show text snippet + image thumbnail | Users need visual scanning - text-only lists are hard to navigate |
| **Post creation date/timestamp** | Low | Show "Created 2 hours ago" or exact date | Temporal context essential for organizing work |
| **Individual post view** | Low | Click to see full post text + full image | Basic drill-down interaction |
| **Regenerate from history** | Medium | Load saved post config, regenerate new version | Users want to iterate on past successful posts |
| **Copy post text** | Low | One-click copy (reuse existing functionality) | Already built in v1.0, must carry forward |
| **Usage counter/quota display** | Low | "You've used 2/3 free generations today" | Critical for freemium - users need visibility into limits |

### Differentiators (Nice-to-Have, Sets Product Apart)

| Feature | Complexity | Notes | Value Proposition |
|---------|-----------|-------|-------------------|
| **Filter by industry** | Low | Dropdown filter using existing 20 Lithuanian categories | Users generate posts for specific clients - quickly find "all restaurant posts" |
| **Filter by date range** | Medium | "Last 7 days", "This month", custom range | Power users generating 50+ posts/month need temporal organization |
| **Search posts by keyword** | Medium | Search post text content | Find that "summer sale" post from 3 weeks ago |
| **Download post as image** | Medium | Render preview as PNG/JPG for download | Some users want to save locally, not just copy text |
| **Post favorites/bookmarks** | Low | Star best posts for quick access | Users have "golden" posts they reuse - make retrieval instant |
| **Batch actions** | High | Select multiple posts, delete/export in bulk | Power user feature for managing 100+ posts |
| **Post templates from history** | Medium | Save best posts as reusable templates | "This restaurant opening post worked great - use it as template for next client" |
| **Export history (CSV/JSON)** | Low | Download all posts for backup/analysis | Users want data portability, builds trust |

### Anti-Features (Deliberately NOT Building)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Collaborative workspaces/sharing** | Target is individual service providers, not teams. Adds massive complexity (permissions, roles, notifications) | Wait for B2B customer validation |
| **Post analytics/performance tracking** | Requires social media integration, tracking pixels, etc. Scope creep - we generate content, not analytics | Focus on generation quality, not post-publication metrics |
| **Post scheduling/publishing** | Becomes a social media management tool (Buffer/Hootsuite competitor). Different product category | Users already have tools for this - stay focused |
| **Version history per post** | Over-engineering for content generation. Users regenerate instead of editing versions | Provide regenerate button, not version control |
| **Folders/nested organization** | Adds UI complexity. Most users generate <50 posts total - flat list with filters is sufficient | Use filters and search instead |
| **Post comments/notes** | Collaboration feature for non-existent use case | Keep it simple - posts are atomic items |

---

## Payment Features

### Table Stakes (Must-Have for Credibility)

| Feature | Complexity | Notes | Rationale |
|---------|-----------|-------|-----------|
| **Free tier with hard limits** | Low | 3 generations/day, resets at midnight | Industry standard - ChatGPT free tier has limits, Canva offers 50 credits/day. Drives conversion |
| **Credit card payment (Stripe)** | Medium | Stripe Checkout for PCI compliance | 80%+ of SaaS uses Stripe. Don't handle card data directly |
| **Subscription billing** | Medium | Monthly recurring via Stripe Billing | Predictable revenue for business, predictable cost for users |
| **Payment method update** | Low | Stripe Customer Portal for self-service | Required for failed payments - users must update expired cards |
| **Subscription cancellation** | Low | Self-service via Stripe Customer Portal | Legal requirement, builds trust. Stripe-hosted portal handles this |
| **Usage quota reset** | Low | Daily reset at midnight (local time) | Clear, predictable limits - users plan their work around resets |
| **Payment failure handling** | Medium | Stripe Smart Retries + email notifications | Involuntary churn is real - automated retries recover revenue |
| **Invoice generation** | Low | Stripe auto-generates invoices | B2B users need invoices for accounting. Stripe handles automatically |

### Differentiators (Nice-to-Have, Sets Product Apart)

| Feature | Complexity | Notes | Value Proposition |
|---------|-----------|-------|-------------------|
| **Hybrid model (base subscription + credits)** | High | €9/month base + 50 credits, buy more credits as needed | 21% higher growth than pure models. HubSpot uses this (500-5000 credits per tier) |
| **Credit rollover** | Medium | Unused credits carry to next month (with cap) | Reduces "use it or lose it" anxiety, increases perceived value |
| **One-time credit purchase** | Medium | Buy 20 credits for €5 without subscription | For occasional users who don't want monthly commitment |
| **Usage alerts** | Low | Email when 80% quota used, when quota exhausted | Users hate hitting limits unexpectedly - proactive notifications build goodwill |
| **Transparent pricing table** | Low | Stripe embedded pricing table on homepage | 3x faster conversion than custom pricing pages |
| **Free trial (7 days unlimited)** | Medium | Stripe supports trials without payment info | Users can sign up and test without friction. Risk: abuse by serial trial users |
| **Annual billing discount** | Low | 20% off if paid yearly | Improves cash flow, reduces churn |
| **Lithuanian tax compliance (VAT)** | Medium | Stripe Tax handles automatic calculation | Legal requirement for Lithuanian business - Stripe Tax automates 135+ countries |
| **Refund self-service** | High | Automated refund for first-time requests | Reduces support burden, builds trust. Box-standard for modern SaaS |

### Anti-Features (Deliberately NOT Building)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Tiered pricing with feature gates** | Too complex for simple tool. Creates support burden ("Why can't I use X on Basic plan?") | Single paid tier with clear quota differences |
| **Per-seat pricing** | Individual tool, not team tool. Doesn't align with use case | Per-user accounts, flat subscription |
| **Metered billing by API usage** | Developer-focused pricing. Target users are marketers/service providers, not engineers | Flat daily limits or credit bundles |
| **Free forever unlimited plan** | Unsustainable - AI generation has real costs (DALL-E, OpenAI). Race to bottom | Generous free tier, clear upgrade path |
| **Cryptocurrency/alternative payments** | Niche demand, adds complexity, volatile pricing | Credit cards + SEPA for EU coverage |
| **Lifetime deals** | Cash now, support burden forever. Kills MRR growth | Focus on sustainable recurring revenue |
| **Enterprise contracts/custom pricing** | No sales team, target audience is SMBs, not enterprises | Self-service pricing only |

---

## Feature Dependencies on Existing v1.0 Features

Understanding how v2.0 integrates with built features:

| Existing v1.0 Feature | v2.0 Integration | Dependency Type |
|-----------------------|------------------|-----------------|
| **Industry selection (20 categories)** | Save with post history, enable filtering by industry | Extend |
| **Image upload + DALL-E generation** | Store image URL/file with post, show in history thumbnail | Store |
| **Post configuration (topic, tone, emoji, length)** | Save full config with post for regeneration | Store |
| **Streaming text generation** | No change - same generation flow for logged-in users | Independent |
| **One-click copy** | Reuse in history view for past posts | Reuse |
| **Regenerate text** | Two contexts: current post (v1.0) and from history (v2.0) | Extend |
| **Facebook/Instagram preview** | Show in history post detail view | Reuse |
| **Mobile/desktop preview toggle** | Apply to history views | Reuse |
| **Loading states** | Apply to history loading, payment processing | Reuse |

**Critical dependency:** All v1.0 generation flows must work identically for free vs paid users. Only difference is quota enforcement.

---

## User Journey Mapping

### Journey 1: New User → First Generation (Free Tier)

```
1. Land on homepage
   ↓
2. Click "Start Creating" → Prompted to sign up
   ↓
3. Sign up via Google (3 clicks)
   ↓ [Profile imported: name, avatar]
4. Onboarding: "Welcome! You have 3 free generations today."
   ↓ [Show quick demo: industry picker → topic → generate]
5. Generate first post
   ↓ [Success! Usage: 1/3 used today]
6. See result + option to save/copy
   ↓
7. Dashboard shows "Your Posts (1)"
```

**Aha moment:** Generated post appears + saved to history (3-5 minutes from signup)
**Friction points:** Social login failure, unclear quota visibility
**Success metric:** 70%+ of signups complete first generation within 10 minutes

### Journey 2: Free User → Paid Conversion

```
1. Free user hits daily limit (3/3 used)
   ↓ [Modal: "Daily limit reached. Upgrade for unlimited?"]
2. Click "View Plans"
   ↓
3. Pricing page with clear comparison:
   - Free: 3/day
   - Pro: Unlimited (€9/month)
   ↓
4. Click "Upgrade to Pro"
   ↓
5. Stripe Checkout (embedded)
   ↓ [Enter card, confirm]
6. Redirect to dashboard
   ↓ [Celebration: "You're now Pro! Generate unlimited posts."]
7. Continue generating immediately
```

**Conversion trigger:** Hitting daily limit (highest intent moment)
**Friction points:** Pricing clarity, card entry friction, unclear benefit
**Success metric:** 5-10% free→paid conversion within 30 days

### Journey 3: Paid User → Retention

```
1. Paid user generates 5-10 posts/week
   ↓
2. Receives value: saves time, clients happy
   ↓
3. Payment auto-renews (Stripe handles)
   ↓ [Invoice emailed automatically]
4. Continues using without interruption
   ↓ [History grows: 50+ posts saved]
5. Occasionally browses history to reuse templates
```

**Retention drivers:** Habit formation (weekly usage), history value (can't lose 50 posts), time savings
**Churn risks:** Card failure (Smart Retries mitigates), cheaper competitor, no longer needed
**Success metric:** <5% monthly churn (industry standard: 3-7%)

### Journey 4: Payment Failure → Recovery

```
1. Monthly charge fails (expired card)
   ↓
2. Stripe Smart Retries (automatic, 4 attempts over 2 weeks)
   ↓ [Email: "Payment failed, please update card"]
3. User clicks email link
   ↓
4. Stripe Customer Portal → update card
   ↓
5. Payment retried → succeeds
   ↓
6. Service continues uninterrupted
```

**Without automation:** 30-40% involuntary churn
**With Smart Retries:** Recovers ~70% of failed payments
**Critical:** Email notifications must be clear, non-alarmist

---

## Phase Prioritization Recommendations

Based on feature dependencies and user journey:

### Phase 1: Authentication Foundation (Week 1-2)
**Why first:** Required for all other features. No history/payments without users.

- Social login (Google, Facebook)
- Email/password authentication
- Password reset
- Email verification
- Session management
- Basic user dashboard (empty state)

**Deliverable:** User can sign up, log in, see dashboard

### Phase 2: Post History (Week 3-4)
**Why second:** Core value prop - users must see value before paying.

- Save generated posts to database
- Post history list view (date, thumbnail, text snippet)
- Individual post view
- Copy post from history
- Regenerate from history
- Basic filters (date, industry)

**Deliverable:** Users see accumulated value (post library)

### Phase 3: Free Tier Quotas (Week 5)
**Why third:** Gating mechanism to drive conversion.

- Daily quota system (3 generations/day)
- Usage counter display ("2/3 used")
- Quota reset (midnight local time)
- Limit enforcement (disable generate when 3/3)
- Upgrade prompt modal when limit hit

**Deliverable:** Free tier works, conversion trigger in place

### Phase 4: Payment Integration (Week 6-7)
**Why fourth:** Requires working free tier to demonstrate value.

- Stripe Checkout integration
- Subscription creation (€9/month)
- Stripe Customer Portal (update card, cancel)
- Payment webhook handling (success, failure)
- Invoice generation (automatic)
- Unlimited quota for paid users

**Deliverable:** Users can upgrade, payments work end-to-end

### Phase 5: Retention Features (Week 8+)
**Why last:** Polish for power users, not MVP critical.

- Usage alerts (80% quota, exhausted)
- Search posts
- Export history
- Favorites/bookmarks
- Download post as image
- Credit rollover (if hybrid model chosen)

**Deliverable:** Improved UX for retained users

---

## MVP Feature Scope (Minimum Credible Product)

To launch v2.0 credibly, MUST include:

**Authentication:**
- [x] Google login (most common in Lithuania)
- [x] Email/password fallback
- [x] Password reset

**History:**
- [x] Post list view (date, thumbnail, text)
- [x] Individual post view
- [x] Copy from history
- [x] Filter by date (basic: last 7 days, 30 days, all)

**Payments:**
- [x] Free tier: 3/day
- [x] Pro tier: Unlimited (€9/month)
- [x] Stripe Checkout
- [x] Usage counter
- [x] Upgrade prompt

**CAN DEFER to v2.1:**
- [ ] Facebook login (add if user demand)
- [ ] Magic link login
- [ ] Search posts
- [ ] Export history
- [ ] Favorites
- [ ] Hybrid credit model
- [ ] Annual billing

---

## Open Questions for Implementation

1. **Social login priority:** Start with Google-only or build Google+Facebook simultaneously?
   **Recommendation:** Google-only MVP (80% coverage), add Facebook in v2.1 if requested.

2. **Quota reset timing:** Midnight local time (complex, user-friendly) or UTC (simple, less intuitive)?
   **Recommendation:** Midnight UTC with clear messaging ("Resets daily at midnight UTC"). Add local time in v2.1.

3. **Payment model:** Pure subscription (€9/month unlimited) or hybrid (€5/month + credits)?
   **Recommendation:** Start pure subscription (simpler), test hybrid in v2.2 if conversion is low.

4. **Image storage:** Store generated images in database/cloud or just save DALL-E URLs?
   **Recommendation:** Save DALL-E URLs for MVP (simpler), add cloud storage if URLs expire or become issue.

5. **Failed payment grace period:** How long until access revoked after payment failure?
   **Recommendation:** 7 days grace period (Stripe Smart Retries cover this). Downgrade to free tier after 7 days, preserve history.

6. **Account deletion:** Immediate or delayed (7-30 days)?
   **Recommendation:** Immediate deletion with 30-day restore window (soft delete). GDPR compliant, user-friendly.

---

## Confidence Assessment

| Feature Category | Confidence | Reasoning |
|------------------|-----------|-----------|
| Authentication (Social login, email/password) | HIGH | Industry standard patterns, verified via Stripe/Auth0 docs, WorkOS best practices |
| History features (List, view, filter) | HIGH | Validated by competitor analysis (Jasper, Copy.ai save all content), common UX pattern |
| Payment integration (Stripe) | HIGH | Official Stripe SaaS documentation verified, proven patterns |
| Free tier limits | MEDIUM | Industry norms researched (ChatGPT: 2-3 images/day, Canva: 50 credits), but optimal number varies |
| Feature prioritization | MEDIUM | Based on logical dependencies, but could adjust based on user feedback |
| Anti-features (What NOT to build) | MEDIUM | Derived from SaaS 2026 trends, but some features might be requested later |

---

## Sources

### Authentication & Onboarding
- [SaaS authentication: the best method(s) to use for your app — WorkOS](https://workos.com/blog/saas-authentication)
- [SaaS Authentication: Key Considerations & Best Practices — Descope](https://www.descope.com/blog/post/saas-auth)
- [SaaS Onboarding in 2026: A Guide to Maximizing Adoption and Retention](https://www.sales-hacking.com/en/post/best-practices-onboarding-saas)
- [8 examples of effective SaaS onboarding experiences — Appcues](https://www.appcues.com/blog/saas-user-onboarding)

### Dashboard & History Features
- [12 best AI content generation tools in 2026 — Netlify](https://www.netlify.com/guides/best-ai-content-generation-tools/)
- [17 Best AI Content Writing Tools Reviewed in 2026 — The CMO](https://thecmo.com/tools/best-ai-content-writing-tools/)
- [Content creation tools for 2026: Plan, create & publish with Planable](https://planable.io/blog/content-creation-tools/)

### Payment Models
- [SaaS 3.0 Analysis: The Shift from Subscriptions to Usage Based AI Billing (2026)](https://editorialge.com/saas-3-0-ai-billing-shift-analysis/)
- [The 2026 Guide to SaaS, AI, and Agentic Pricing Models — Monetizely](https://www.getmonetizely.com/blogs/the-2026-guide-to-saas-ai-and-agentic-pricing-models)
- [6 Proven Pricing Models for AI SaaS — Lago Blog](https://www.getlago.com/blog/6-proven-pricing-models-for-ai-saas)
- [SaaS Credits System Guide 2026: Billing Models & Implementation](https://colorwhistle.com/saas-credits-system-guide/)

### Stripe Integration
- [Integrate a SaaS business on Stripe — Stripe Documentation](https://docs.stripe.com/saas)
- [Best practices for SaaS billing — Stripe](https://stripe.com/resources/more/best-practices-for-saas-billing)
- [Stripe Integration Guide: Building Payment Flows for SaaS](https://anotherwrapper.com/blog/stripe-integration-guide)

### Usage Limits & Quotas
- [Freemium Model Design: Building a Free Tier That Drives Paid Conversions - 2026 Guide](https://resources.rework.com/libraries/saas-growth/freemium-model-design)
- [Gemini API Rate Limits 2026: Complete Per-Tier Guide](https://www.aifreeapi.com/en/posts/gemini-api-rate-limits-per-tier)
- [ChatGPT Free Plan Image Generation Limits: Complete Reset Time & Bypass Guide (2025)](https://www.aifreeapi.com/en/posts/chatgpt-image-generation-limit-free-plan)

### SaaS Anti-Patterns
- [What Will Actually Work in SaaS in 2026 (And What Won't) — DEV Community](https://dev.to/digitalwareshub/what-will-actually-work-in-saas-in-2026-and-what-wont-2c7l)
- [2026 SaaS Roadmap for Founders: AI, PLG & Profitable Growth](https://startupill.com/2026-saas-roadmap-for-founders/)

### Competitor Analysis
- [Jasper AI Pricing (2026): Which Plan Is Best For You? — DemandSage](https://www.demandsage.com/jasper-ai-pricing/)
- [Jasper Vs Copy.ai: Which AI Tool Scales Businesses In 2026?](https://aitoolchooser.com/jasper-vs-copyai-which-ai-tool-scales-business/)
- [A Complete Guide to Copy.ai Pricing and Alternatives](https://www.eesel.ai/blog/copy-ai-pricing)
