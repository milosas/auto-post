# Phase 8: Payments - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can subscribe or purchase credits to unlock more generations via Stripe. Includes monthly/annual subscriptions with three tiers, one-time credit packages, Stripe Customer Portal for management, and webhook handling for subscription lifecycle events.

</domain>

<decisions>
## Implementation Decisions

### Pricing Structure

**Subscription Plans (Monthly):**
| Plan | Price | Generations | Price/gen |
|------|-------|-------------|-----------|
| Starter | €9/mėn | 30/mėn | €0.30 |
| Pro | €19/mėn | 70/mėn | €0.27 |
| Unlimited | €49/mėn | Neribota | - |

**Annual Plans (2 months free):**
- Starter: €90/metus (€7.50/mėn effective)
- Pro: €190/metus (€15.83/mėn effective)
- Unlimited: €490/metus (€40.83/mėn effective)

**Credit Packages (One-time, more expensive than subscription to incentivize recurring):**
| Package | Price | Price/gen |
|---------|-------|-----------|
| 10 kreditų | €5 | €0.50 |
| 30 kreditų | €12 | €0.40 |
| 100 kreditų | €35 | €0.35 |

**Margin target:** 80-90% (based on ~€0.035 cost per generation)

### Payment UI/UX
- Upgrade CTA visible in header at all times + enhanced message when limit reached
- Dedicated /pricing page with full plan comparison and features table
- After successful payment: redirect to main page with toast notification "Prenumerata aktyvuota!"
- Subscription management via Stripe Customer Portal (cancel, update payment method)

### Subscription Behavior
- Cancellation: subscription remains active until end of current billing period, then stops
- Failed payment: 3-day grace period with email reminders before downgrade to free
- Downgrade (Pro → Starter): takes effect from next billing period
- Upgrade (Starter → Pro): immediate with prorated charge for remaining period

### Credits System
- Credits never expire (purchased = permanent)
- 1 credit = 1 generation (includes text + image if generated)
- If user has both subscription AND credits: subscription quota used first, credits are backup
- No bonus credits for larger packages (volume discount already reflected in per-credit price)

### Claude's Discretion
- Stripe product/price ID naming conventions
- Webhook event handling implementation details
- Email notification templates for payment events
- Exact pricing page design and layout

</decisions>

<specifics>
## Specific Ideas

- Free tier remains 3 generations/day (from Phase 7)
- Subscription quotas are monthly, not daily (unlike free tier)
- Credits serve as overflow for subscribers who need occasional extra capacity
- Pricing designed so subscription is always better value than credits (retention incentive)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-payments*
*Context gathered: 2026-02-01*
