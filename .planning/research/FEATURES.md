# Feature Landscape: AI Social Media Post Generator

**Domain:** Social media content generation for small service businesses
**Target Users:** Lithuanian beauty specialists, trainers, physiotherapists, massage therapists
**Researched:** 2026-01-25
**Confidence:** HIGH

## Executive Summary

The AI social media post generator market in 2026 is mature and crowded. Success depends on being **dramatically simpler** than competitors, not more feature-rich. Users expect AI content generation and basic customization as table stakes, but most tools suffer from feature bloat that slows down workflows.

Your competitive advantage: **Speed and focus**. Generate a Lithuanian post in under 60 seconds by ruthlessly cutting everything that doesn't serve that goal.

---

## Table Stakes Features

Features users expect. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **AI text generation** | 79% of social media managers use AI daily; it's the baseline expectation in 2026 | Medium | Must support Lithuanian language well - this is non-negotiable for your target market |
| **Tone/style control** | Users need casual vs professional options; platform-specific tone is expected | Low | 3-5 preset tones (friendly, professional, promotional, inspirational, casual) sufficient |
| **Emoji integration** | Posts with emojis receive higher engagement; users expect automatic addition | Low | Auto-suggest emojis based on content, with toggle to enable/disable |
| **Platform optimization** | Content must be formatted for Instagram/Facebook specifically | Medium | Character limits, formatting differences between platforms |
| **Copy to clipboard** | Essential for your "copy and paste" workflow; users need one-click copy | Low | Single "Copy" button - this is critical for 60-second goal |
| **Image support** | 41% of Facebook posts use AI visuals; users expect image+text together | Medium | Both upload AND generation options needed (see details below) |
| **Mobile-friendly interface** | Service providers work on phones; desktop-only is a dealbreaker | Medium | Responsive design essential - many users will access on mobile |
| **Post length control** | Users need short captions vs long storytelling options | Low | Presets: Short (1-2 sentences), Medium (3-5), Long (paragraph+) |

### Critical Implementation Details

**AI Text Generation - Lithuanian:**
- Sources show 19+ languages supported by major tools, but quality varies
- Lithuanian is less common - verify your AI provider's Lithuanian quality thoroughly
- Service providers need natural, conversational Lithuanian, not formal/stiff language
- **Pitfall:** Machine-translated Lithuanian will feel wrong to native speakers

**Image Support - Dual Approach:**
- Research shows users want BOTH upload and generation options
- Upload: "More personal touch" for brand authenticity
- Generation: Speed and convenience when no photo available
- **Recommendation:** Default to upload (fits service provider use case - they have treatment photos), generation as fallback

---

## Differentiators

Features that set your product apart. Not expected, but create competitive advantage.

| Feature | Value Proposition | Complexity | Strategic Rationale |
|---------|-------------------|------------|---------------------|
| **Industry-specific templates** | Beauty/wellness content has specific patterns; templates save thinking time | Low-Medium | Pre-written starting points: "Before/After", "Client Testimonial", "Treatment Spotlight", "Tip of the Day" |
| **Lithuanian-first design** | Global tools treat Lithuanian as afterthought; you make it primary | Low | All UI, examples, templates in Lithuanian - signals "built for you" |
| **60-second guarantee** | Explicit speed promise vs competitors' feature bloat | Low | Market positioning; forces ruthless simplicity in design |
| **No account required** | Reduces friction; can use immediately without signup | Low | Huge differentiator vs SaaS competitors requiring login |
| **Industry selector** | Automatically adjusts tone/vocabulary for beauty vs fitness vs therapy | Medium | "Beauty specialist" uses different language than "physiotherapist" |
| **Local market awareness** | Understands Lithuanian service market norms (pricing hints, seasonal patterns) | Medium | References to Lithuanian holidays, seasonal services (summer prep, winter skincare) |

### Strategic Differentiator Analysis

**Why Industry-Specific Templates Win:**
- Research shows themed content ("Makeover Monday", "Wellness Wednesday") performs well
- Service providers struggle with "what to post about" - templates solve this
- Complexity: LOW - just pre-written prompts with blanks to fill
- **Example:** "Share your favorite [season] treatment and why clients love it"

**Why "No Account Required" is Powerful:**
- Your target users are time-poor small business owners
- Competitors (Buffer, Canva, SocialBee) all require accounts
- You can start generating immediately - massive friction reduction
- Trade-off: Can't save history or schedule posts, but that's fine for your use case

**Why Lithuanian-First Matters:**
- Major tools (Predis.ai, Buffer, SocialPilot) support Lithuanian but design for English
- Examples, templates, UI all assume English-speaking user
- Being Lithuanian-native signals: "This tool understands my market"
- Small feature, huge psychological impact

---

## Anti-Features

Features to explicitly NOT build. Common in competitor tools but wrong for your product.

| Anti-Feature | Why Avoid | What to Do Instead | Evidence |
|--------------|-----------|-------------------|----------|
| **Post scheduling** | Adds complexity; not needed for copy-paste workflow; users can schedule natively in Facebook | Simple copy button | Scheduling is "table stakes" for social media management tools, but you're a content GENERATOR, not a manager. Buffer owns scheduling; don't compete. |
| **Multi-platform publishing** | Requires OAuth integrations, API maintenance, permission scopes - huge complexity | Copy and paste works everywhere | Direct publishing to platforms adds minimal value vs massive engineering cost |
| **Analytics dashboard** | Outside your core value; Facebook/Instagram provide native analytics | Focus on content quality | Users already have analytics in native platforms; duplicating adds bloat |
| **Team collaboration features** | Your users are solo practitioners or tiny teams (1-2 people) | Single-user simplicity | Team features (approval workflows, multi-user access) add complexity your market doesn't need |
| **Content calendar** | Implies planning weeks ahead; your users work day-to-day | Generate-and-post workflow | Service providers post reactively (client result, daily tip), not strategic campaigns |
| **Hashtag research tools** | Hashtags are declining in importance; Instagram now limits to 5, prioritizes content quality | Auto-suggest 3-5 relevant hashtags | Research shows "hashtag stuffing" is dead in 2026; Instagram limits to 5; quality > quantity |
| **A/B testing** | Too sophisticated for target market; requires analytics integration | Single best-practice output | Small service providers don't have volume for meaningful A/B tests |
| **Brand kit (fonts, colors, logos)** | Adds design complexity; most posts are photo + text, not designed graphics | Focus on text quality | Competitor feature (Canva, SocialBee) but wrong for your use case - users post treatment photos, not branded graphics |
| **Content recycling/resharing** | Assumes large content library; your users create fresh content each time | Fresh generation every time | Tools like SocialPilot offer "evergreen content recycling" but small businesses don't think this way |
| **Advanced tone controls (10+ options)** | Decision paralysis; too many choices slow workflow | 3-5 clear preset tones | Balance: enough options to feel customizable, few enough to decide quickly |

### Critical Anti-Feature Rationale

**Why No Scheduling:**
- Research confirms scheduling is "table stakes" for social media MANAGEMENT tools
- But you're a GENERATOR, not a manager - different category
- Facebook/Instagram have native scheduling (free)
- Scheduling adds: OAuth complexity, API maintenance, platform policy changes, token management
- Benefit: Minimal (users can schedule in platform in 10 seconds)
- **Verdict:** Massive complexity for negligible value

**Why No Hashtag Research:**
- Instagram limits hashtags to 5 (down from 30) as of 2026
- Algorithms now prioritize content quality over hashtag volume
- "Hashtag stuffing" era is over
- Auto-suggesting 3-5 relevant hashtags is sufficient
- Research tools add complexity without ROI

**Why No Brand Kit:**
- Service providers post real photos (before/after, treatment rooms, client results)
- Not creating designed graphics that need brand colors/fonts
- Canva owns the "design your post" space - don't compete
- Your value: TEXT quality in Lithuanian, not visual design

---

## Feature Dependencies

Understanding what must be built first and what depends on other features.

```
CORE FOUNDATION (Must build first):
├── AI text generation (Lithuanian)
├── Copy to clipboard
└── Basic UI (industry selector, image upload)

TIER 1 (Depends on foundation):
├── Tone/style presets → Requires: AI text generation
├── Post length control → Requires: AI text generation
├── Emoji integration → Requires: AI text generation
└── Platform selection → Requires: AI text generation

TIER 2 (Enhancement features):
├── Industry-specific templates → Requires: Industry selector, AI generation
├── Image generation (optional) → Requires: Basic UI, AI provider with image support
└── Hashtag auto-suggest → Requires: AI text generation, platform selection

INDEPENDENT (Can build anytime):
├── Mobile-responsive design
└── Lithuanian-first UI/UX
```

### Build Order Recommendation

**Phase 1 - Core MVP (Week 1-2):**
1. Industry selector dropdown (5 industries)
2. Image upload (simple file input)
3. AI text generation API integration (Lithuanian)
4. Basic tone selector (3 options: Friendly, Professional, Promotional)
5. Copy to clipboard button
6. Character count display

**Phase 2 - Table Stakes (Week 3):**
7. Post length presets (Short/Medium/Long)
8. Emoji toggle (on/off)
9. Platform selector (Facebook/Instagram)
10. Mobile-responsive layout

**Phase 3 - Differentiators (Week 4+):**
11. Industry-specific templates (3-5 per industry)
12. Lithuanian market awareness (seasonal content suggestions)
13. Image generation as fallback option

---

## MVP Feature Set

For MVP, prioritize these features to validate core value proposition:

### Must Have (Launch Blockers):
1. **Industry selector** - 5 industries minimum (beauty specialist, personal trainer, physiotherapist, massage therapist, cosmetologist)
2. **Image upload** - Simple file input, preview, ability to change
3. **AI text generation** - Lithuanian language, connected to GPT-4 or Claude
4. **Tone selector** - 3 presets (Friendly, Professional, Promotional)
5. **Post length** - 3 presets (Short, Medium, Long)
6. **Copy to clipboard** - One-click copy of generated text
7. **Mobile-friendly UI** - Works on phones

### Should Have (Important but not blockers):
8. **Emoji toggle** - Auto-add emojis or not
9. **Platform selector** - Optimize for Facebook vs Instagram
10. **Character count** - Show length, warn if too long

### Could Have (Defer to post-MVP):
11. **Industry templates** - Pre-written starting points
12. **Image generation** - AI-generated images as fallback
13. **Hashtag suggestions** - Auto-suggest 3-5 hashtags
14. **Seasonal awareness** - Lithuanian holiday/seasonal content

### Won't Have (Explicitly excluded):
- ❌ Post scheduling
- ❌ Direct publishing to platforms
- ❌ Analytics
- ❌ Team collaboration
- ❌ Content calendar
- ❌ Advanced hashtag research
- ❌ A/B testing
- ❌ Brand kit (colors, fonts, logos)

---

## Feature Complexity Assessment

Understanding implementation effort for roadmap planning.

### Low Complexity (1-3 days each):
- Industry selector dropdown
- Tone selector (3-5 presets)
- Post length selector (3 presets)
- Copy to clipboard button
- Emoji toggle (on/off)
- Character count display
- Platform selector (Facebook/Instagram)

### Medium Complexity (3-7 days each):
- AI text generation integration (requires API setup, prompt engineering)
- Image upload with preview
- Mobile-responsive design
- Industry-specific templates (requires content writing for each industry)
- Lithuanian language quality tuning (testing, refinement)
- Hashtag auto-suggest (basic implementation)

### High Complexity (1-2 weeks each):
- Image generation integration (requires second AI provider, UI for prompt input)
- Lithuanian market awareness (seasonal patterns, local context)
- Advanced prompt engineering for industry-specific vocabulary

### Very High Complexity (Avoid for MVP):
- Post scheduling (OAuth, API integrations, cron jobs)
- Direct publishing (multiple platform APIs, auth flows)
- Analytics dashboard (data collection, visualization, storage)
- Team features (user management, permissions, collaboration)

---

## Competitive Feature Analysis

What competitors offer vs what you should build.

| Feature Category | Canva | Buffer | SocialBee | Predis.ai | **Your Tool** |
|------------------|-------|--------|-----------|-----------|---------------|
| AI text generation | ✅ | ✅ | ✅ | ✅ | ✅ **Must have** |
| Image generation | ✅ | ❌ | ❌ | ✅ | ⚠️ **Optional (defer)** |
| Image upload | ✅ | ✅ | ✅ | ✅ | ✅ **Must have** |
| Post scheduling | ✅ | ✅ | ✅ | ✅ | ❌ **Anti-feature** |
| Direct publishing | ✅ | ✅ | ✅ | ✅ | ❌ **Anti-feature** |
| Multi-platform | ✅ | ✅ | ✅ | ✅ | ⚠️ **FB/IG only** |
| Analytics | ✅ | ✅ | ✅ | ❌ | ❌ **Anti-feature** |
| Team features | ✅ | ✅ | ✅ | ❌ | ❌ **Anti-feature** |
| Templates | ✅ | ❌ | ✅ | ❌ | ✅ **Differentiator** |
| Industry-specific | ❌ | ❌ | ❌ | ❌ | ✅ **Differentiator** |
| Lithuanian-first | ❌ | ❌ | ❌ | ❌ | ✅ **Differentiator** |
| No account needed | ❌ | ❌ | ❌ | ❌ | ✅ **Differentiator** |
| <60sec workflow | ❌ | ❌ | ❌ | ❌ | ✅ **Differentiator** |

### Competitive Positioning

**Canva:** Design-first platform with AI features. Strength: Visual design tools. Weakness: Complex for simple text posts; requires account; not Lithuanian-focused.

**Buffer:** Scheduling-first platform with AI assistant. Strength: Simple, lightweight. Weakness: Still requires account; scheduling-focused (not pure generation); English-primary.

**SocialBee:** Full-featured social media manager. Strength: 1000+ prompts, comprehensive features. Weakness: Feature bloat; expensive ($30+/month); overwhelming for small businesses.

**Predis.ai:** AI content generator with visuals. Strength: 19+ languages including Lithuanian; free tier. Weakness: Requires login; focused on carousels/visuals; generic (not industry-specific).

**Your Competitive Advantage:**
1. **Lithuanian-first** - Not just translation, but native design
2. **Industry-specific** - Built for beauty/wellness/therapy, not generic
3. **Speed-obsessed** - 60-second guarantee vs competitors' multi-step workflows
4. **Zero friction** - No account, no login, no onboarding
5. **Copy-paste workflow** - Explicitly designed for manual posting (most users' reality)

---

## Feature Prioritization Framework

How to decide what to build next.

### Decision Matrix

For each potential feature, score 1-5 on:
- **Speed impact:** Does this help achieve 60-second goal?
- **Differentiation:** Does this separate you from competitors?
- **Table stakes:** Do users expect this?
- **Complexity:** How hard to build? (inverse score: 1=hard, 5=easy)

**Formula:** Priority Score = (Speed × 2) + Differentiation + Table Stakes - Complexity

### Scored Examples

| Feature | Speed | Diff | Stakes | Complex | Score | Verdict |
|---------|-------|------|--------|---------|-------|---------|
| Industry selector | 5 | 5 | 3 | 5 | 23 | ✅ Build now |
| AI generation | 5 | 3 | 5 | 3 | 16 | ✅ Build now |
| Copy button | 5 | 4 | 5 | 5 | 24 | ✅ Build now |
| Tone presets | 4 | 3 | 4 | 5 | 20 | ✅ Build now |
| Image upload | 4 | 2 | 5 | 4 | 17 | ✅ Build now |
| Templates | 5 | 5 | 2 | 3 | 15 | ⚠️ Phase 2 |
| Image generation | 2 | 3 | 4 | 1 | 10 | ⚠️ Defer |
| Scheduling | 1 | 1 | 4 | 1 | 5 | ❌ Don't build |
| Analytics | 1 | 1 | 2 | 1 | 3 | ❌ Don't build |

---

## User Journey Feature Mapping

What features serve each step of the 60-second workflow.

### Target Journey:
1. **Land on page** (0:00) → No login required ✅
2. **Select industry** (0:05) → Industry dropdown ✅
3. **Upload/generate image** (0:15) → Image upload (primary), generation (fallback)
4. **Configure settings** (0:30) → Tone selector, length selector, emoji toggle, platform
5. **Generate text** (0:35) → AI generation API call
6. **Review & refine** (0:50) → Display generated text, regenerate option
7. **Copy & use** (0:55) → Copy to clipboard button
8. **Done** (0:60) ✅

### Features Required for Journey:

**Step 1-2 (0-5 sec):** Zero friction start
- ✅ No login/account
- ✅ Clear landing page explaining workflow
- ✅ Industry selector (5 industries minimum)

**Step 3 (5-15 sec):** Image handling
- ✅ Image upload (drag-drop or file picker)
- ✅ Image preview
- ⚠️ Image generation (fallback, can defer)

**Step 4 (15-30 sec):** Configuration
- ✅ Tone selector (3-5 presets)
- ✅ Length selector (Short/Medium/Long)
- ✅ Platform selector (Facebook/Instagram)
- ✅ Emoji toggle (on/off)
- ⚠️ Hashtag preference (3-5 auto-suggested, can defer)

**Step 5-6 (30-50 sec):** AI generation
- ✅ Generate button
- ✅ Loading state (with progress indication)
- ✅ Display generated text
- ✅ Character count
- ⚠️ Regenerate option (nice to have)

**Step 7-8 (50-60 sec):** Output
- ✅ Copy to clipboard (single click)
- ✅ Success confirmation
- ⚠️ Download as image+text (optional enhancement)

---

## Sources

Research based on current ecosystem analysis (2026):

**General AI Social Media Tools:**
- [Canva AI Social Media Post Generator](https://www.canva.com/features/ai-social-media-post-generator/)
- [SocialBee AI Post Generator](https://socialbee.com/ai-post-generator/)
- [Buffer AI Social Media Post Creator](https://buffer.com/ai-assistant/social-media-post-creator)
- [Best AI Social Media Post Generators (Softailed)](https://softailed.com/blog/best-ai-social-media-post-generators)
- [6 Best AI Social Media Post Generators (CyberLink)](https://www.cyberlink.com/blog/photo-marketing-business/3828/best-ai-social-media-post-generator)

**Industry Trends & Table Stakes:**
- [Social Media Trends 2026 (Slate)](https://slateteams.com/blog/social-media-trends-2026)
- [Social Media Trends to Shape 2026 Strategy (Amplitude)](https://amplitudemktg.com/social-media/the-18-social-media-trends-to-shape-your-2026-strategy/)
- [11 Best Social Media Management Tools 2026 (Buffer)](https://buffer.com/resources/best-social-media-management-tools/)

**Competitive Advantages & Differentiation:**
- [Top 10 Social Media Trends 2026 (ALM Corp)](https://almcorp.com/blog/social-media-trends-2026/)
- [7 Social Media Trends to Know (Sprout Social)](https://sproutsocial.com/insights/social-media-trends/)
- [Best AI Social Media Post Generators Comparison](https://softailed.com/blog/best-ai-social-media-post-generators)

**Small Business Needs:**
- [20 Best Free Social Media Management Tools (TheCMO)](https://thecmo.com/tools/best-free-social-media-management-tools/)
- [12 Best Social Media Content Creation Tools (Proom)](https://proom.ai/blog/social-media-content-creation-tools)
- [Best Social Media Tools for Business (WebsitePlanet)](https://www.websiteplanet.com/social-media-tools/)

**Service Provider Content:**
- [Personality-led Content Trends 2026 (Professional Beauty)](https://professionalbeauty.co.uk/digital-marketing-trends-2026-salons-and-clinics)
- [50 Social Media Ideas for Spas and Salons (Edgeless Beauty)](https://edgelessbeautypro.com/blog/for-skincare-professionals/social-media-ideas-for-spas-salons/)
- [Social Media for Massage Therapists (AMTA)](https://www.amtamassage.org/about/news/guide-to-social-media/)

**Multilingual Capabilities:**
- [7 Best Tools for Multilingual Social Media Posts (Dialzara)](https://dialzara.com/blog/7-ai-tools-for-multilingual-social-media-posts)
- [Guide to Multilingual Social Media Management (Fanpage Karma)](https://www.fanpagekarma.com/insights/a-guide-to-multilingual-social-media-management/)

**Hashtag Strategy:**
- [Are Hashtags Still Relevant in 2026? (First Ascent)](https://firstascentdesign.com/hashtag-strategy-2026/)
- [Ultimate 2026 Guide to Social Media Hashtags (Outfy)](https://www.outfy.com/blog/the-ultimate-guide-to-social-media-hashtags/)
- [Instagram Hashtag Tips 2026 (Sked Social)](https://skedsocial.com/blog/how-to-use-hashtags-on-instagram-in-2026-hashtag-tips-to-up-your-insta-game)

**Feature Analysis:**
- [Buffer: Schedule Natively or Use Buffer?](https://buffer.com/resources/schedule-social-media-posts-natively/)
- [Social Media Scheduling Guide (Sendible)](https://www.sendible.com/insights/guide-to-social-media-management-for-small-businesses)
- [Text to Emoji Generators (Vista Social)](https://vistasocial.com/social-media-tools/text-to-emoji-translator/)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| **Table stakes features** | HIGH | Consistent across 10+ sources; clear market consensus on AI generation, tone control, platform optimization |
| **Differentiators** | HIGH | Lithuanian-first and industry-specific are validated gaps in competitor analysis; no account requirement confirmed as friction point |
| **Anti-features** | HIGH | Scheduling/publishing complexity well-documented; hashtag decline confirmed by Instagram policy changes (5 hashtag limit) |
| **Complexity estimates** | MEDIUM | Based on general web development experience; actual implementation may vary based on AI provider choice |
| **Service provider needs** | MEDIUM-HIGH | Verified through beauty/wellness industry sources; personality-led content and authenticity trends confirmed for 2026 |
| **Lithuanian market specifics** | MEDIUM | Language support confirmed in major tools, but quality/native design gap is logical inference rather than direct evidence |

---

## Open Questions for Validation

Features to validate with target users before building:

1. **Image generation necessity:** Do service providers actually need AI image generation, or do they always have real photos? (Hypothesis: They have photos, generation is unnecessary)

2. **Template value:** Will pre-written templates actually save time, or do they feel generic? (Test with 5 beauty specialists)

3. **Tone presets:** Are 3 presets enough, or do users need more granularity? (Could test: Friendly, Professional, Promotional, Inspirational, Urgent)

4. **Hashtag preference:** Do Lithuanian service providers use hashtags heavily, or is this a declining practice? (Instagram limits to 5, but local behavior may differ)

5. **Platform priority:** Is Facebook or Instagram more important to Lithuanian service providers? (Affects optimization priority)

6. **Post length preference:** Do beauty/wellness providers prefer short punchy posts or longer storytelling? (Industry-specific insight needed)

7. **Regenerate frequency:** How often do users want to regenerate vs editing the output? (Affects whether editing features are needed)

---

## Recommendations Summary

### ✅ Build These (MVP Core):
1. Industry selector (5 industries)
2. AI text generation (Lithuanian, GPT-4 or Claude)
3. Tone selector (3 presets: Friendly, Professional, Promotional)
4. Post length selector (Short, Medium, Long)
5. Image upload with preview
6. Platform selector (Facebook/Instagram)
7. Emoji toggle (on/off)
8. Copy to clipboard button
9. Mobile-responsive design
10. Character count display

### ⚠️ Consider These (Phase 2):
11. Industry-specific templates (3-5 per industry)
12. Hashtag auto-suggest (3-5 relevant hashtags)
13. Regenerate button
14. Lithuanian seasonal awareness

### ⏸️ Defer These (Post-MVP):
15. Image generation (AI-generated images)
16. Advanced tone options (>5 presets)
17. Download as image+text
18. Multiple language support (start Lithuanian-only)

### ❌ Don't Build These:
- Post scheduling
- Direct publishing to platforms
- Analytics dashboard
- Team collaboration features
- Content calendar
- Advanced hashtag research
- A/B testing
- Brand kit (colors, fonts, logos)
- Content recycling/resharing
- Multiple platform support beyond FB/IG

---

## Success Metrics

How to measure if features deliver on the 60-second promise:

**Primary Metric:**
- **Time to copy:** Measure from page load to clipboard copy (target: <60 seconds)

**Secondary Metrics:**
- **Generation success rate:** % of users who successfully generate text (target: >90%)
- **Regeneration rate:** % of users who regenerate text (lower is better; indicates first generation quality)
- **Feature usage:** Which customization options are actually used vs ignored
- **Mobile vs desktop:** Usage split (hypothesis: 60%+ mobile for service providers)
- **Industry distribution:** Which industries use the tool most (informs template priorities)

**Qualitative Validation:**
- **User interviews:** Do Lithuanian service providers find output natural/authentic?
- **Template effectiveness:** Do users select templates or prefer blank generation?
- **Copy-paste workflow:** Do users actually copy-paste, or do they want scheduling? (Validates anti-feature decision)
