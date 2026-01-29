# Phase 5: Authentication - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can securely create accounts and authenticate across sessions. Clerk handles auth with Google OAuth and email/password options. Anonymous users retain full access to generation workflow. Clerk user data syncs to database via webhooks.

</domain>

<decisions>
## Implementation Decisions

### Sign-up flow
- Equal visual weight for Google OAuth and email/password options
- Google OAuth only (no Facebook, GitHub, or other providers)
- Email verification NOT required for free tier usage
- Email verification REQUIRED before purchasing credits or subscription (gate at payment, not signup)

### Login methods
- Three options available: Google OAuth, email/password, magic link (passwordless)
- Magic link as explicit option — users choose between password or email link
- Standard password reset via email link (not magic-link-to-login approach)

### Error messaging
- Specific feedback on failed login: "No account with this email" or "Wrong password"
- Not generic "Invalid credentials" — prioritize user clarity over hiding email existence

### Claude's Discretion
- Signup fields (email+password minimum, optional name collection)
- Session duration (balance security and convenience)
- Rate limiting on auth endpoints
- UI component styling within Clerk's customization options

</decisions>

<specifics>
## Specific Ideas

- Verification gate at payment, not signup — "verify email before purchasing" reduces friction for free users exploring the tool
- This preserves the v1 philosophy: users experience value before any friction

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-authentication*
*Context gathered: 2026-01-29*
