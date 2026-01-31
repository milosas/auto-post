---
phase: 06-post-history
plan: 02
subsystem: api
tags: [api-routes, next.js, authentication, supabase, drizzle]
requires: [06-01]
provides: [post-crud-api, image-upload-api, pagination-api]
affects: [06-03, 06-04]
tech-stack:
  added: []
  patterns: [rest-api, cursor-pagination, soft-delete]
key-files:
  created:
    - app/api/posts/route.ts
    - app/api/posts/[id]/route.ts
  modified: []
key-decisions:
  - API-01: Node.js runtime over Edge runtime (Drizzle requires Node.js built-ins)
  - API-02: Internal user ID lookup pattern (auth ID → internal ID for every request)
  - API-03: Error responses return JSON for consistency (even 204 uses NextResponse)
duration: 6 min
completed: 2026-01-31
---

# Phase 6 Plan 02: Post CRUD API Routes Summary

**One-liner:** REST API for post management with auth, pagination, favorites, and DALL-E image upload

## What Was Built

Created complete REST API for post CRUD operations:

**POST /api/posts** - Save new post
- Validates text and config (required fields)
- Uploads DALL-E image to permanent Supabase Storage if provided
- Creates post record with generation config
- Returns post ID (201 Created)

**GET /api/posts** - List posts with pagination
- Cursor-based pagination (stable, performant)
- Search filter (case-insensitive text search)
- Favorites filter (boolean)
- Returns posts array + next cursor

**GET /api/posts/[id]** - Get single post
- Returns full post object with all fields
- 404 if not found or doesn't belong to user

**PATCH /api/posts/[id]** - Toggle favorite
- Toggles isFavorite (0 ↔ 1)
- Returns new favorite state

**DELETE /api/posts/[id]** - Soft delete
- Sets deletedAt timestamp
- 204 No Content on success

All endpoints:
- Require authentication (401 if not authenticated)
- Verify post ownership (404 if post doesn't belong to user)
- Return JSON errors with appropriate status codes

## Files Created/Modified

**Created:**
- `app/api/posts/route.ts` (184 lines) - POST and GET handlers
- `app/api/posts/[id]/route.ts` (234 lines) - GET, PATCH, DELETE handlers

**Modified:** None

## Decisions Made

**API-01: Node.js runtime over Edge runtime**
- **Context:** Plan specified `export const runtime = 'edge'` for consistency with generate routes
- **Issue:** Drizzle ORM with `postgres` library requires Node.js built-ins (net, tls, crypto) not available in Edge runtime
- **Decision:** Use Node.js runtime (default) instead of Edge runtime
- **Rationale:**
  - Existing `/api/auth/sync` route uses Node.js runtime with database access
  - Edge runtime incompatible with postgres library
  - Alternative (@vercel/postgres) would require refactoring entire database layer
- **Trade-off:** Slightly longer cold start vs Edge runtime, but negligible for authenticated endpoints
- **Pattern:** Database-accessing routes use Node.js runtime; stateless routes (generate) use Edge runtime

**API-02: Internal user ID lookup pattern**
- **Context:** Every endpoint needs to convert Supabase auth ID to internal database user ID
- **Decision:** Perform lookup at the start of every request handler
- **Rationale:**
  - Ensures fresh user data (no caching staleness)
  - Clear separation between auth layer (Supabase) and data layer (Drizzle)
  - Consistent error handling (404 if user not in database)
- **Alternative considered:** Middleware to inject user ID - rejected as overly complex for v2.0
- **Future:** If performance becomes concern, add user ID caching with TTL

**API-03: Consistent JSON error responses**
- **Decision:** All error responses return `{ error: string }` JSON
- **Exception:** DELETE returns 204 No Content on success (no body)
- **Rationale:** Client can parse errors uniformly across all endpoints
- **Pattern:**
  - 400 Bad Request - validation errors
  - 401 Unauthorized - not authenticated
  - 404 Not Found - post not found or user not in database
  - 500 Internal Server Error - unexpected errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed Edge runtime to fix postgres incompatibility**
- **Found during:** Task 1 (Create posts collection API route)
- **Issue:** Plan specified `export const runtime = 'edge'` but build failed with "Module not found: Can't resolve 'net'" because postgres library requires Node.js built-ins
- **Fix:** Removed `export const runtime = 'edge'` and added comment explaining Node.js runtime requirement
- **Files modified:** app/api/posts/route.ts, app/api/posts/[id]/route.ts
- **Verification:** Next.js build succeeded, routes compile without errors
- **Impact:** Database-accessing API routes now follow same pattern as `/api/auth/sync` (Node.js runtime)

**Total deviations:** 1 auto-fixed (blocking issue)

## Performance Metrics

- **Execution time:** 6 minutes
- **Tasks completed:** 2/2
- **Commits:** 2 (1 per task)
  - af4ad6e: feat(06-02): create posts collection API route (POST + GET)
  - 09efd6e: feat(06-02): create single post API route (GET + PATCH + DELETE)
- **Lines of code:** 418 (184 + 234)
- **Files created:** 2

## Testing Notes

**Manual testing required** (no automated tests in v2.0):

1. **Authentication flow:**
   ```bash
   # Should return 401 (not authenticated)
   curl -X POST http://localhost:3000/api/posts \
     -H "Content-Type: application/json" \
     -d '{"text":"test","config":{}}'
   ```

2. **Save post (authenticated):**
   ```bash
   # Should return 201 with postId
   curl -X POST http://localhost:3000/api/posts \
     -H "Content-Type: application/json" \
     -H "Cookie: [auth-cookie]" \
     -d '{"text":"Test post","config":{"industry":"tech","tone":"professional","length":100,"emoji":false}}'
   ```

3. **List posts (authenticated):**
   ```bash
   # Should return posts array + nextCursor
   curl http://localhost:3000/api/posts?search=test&favorites=false \
     -H "Cookie: [auth-cookie]"
   ```

4. **Get single post:**
   ```bash
   curl http://localhost:3000/api/posts/1 \
     -H "Cookie: [auth-cookie]"
   ```

5. **Toggle favorite:**
   ```bash
   curl -X PATCH http://localhost:3000/api/posts/1 \
     -H "Cookie: [auth-cookie]"
   ```

6. **Delete post:**
   ```bash
   curl -X DELETE http://localhost:3000/api/posts/1 \
     -H "Cookie: [auth-cookie]"
   # Should return 204 No Content
   ```

## Integration Points

**Consumes:**
- `lib/supabase/server.ts` - Authentication (getUser)
- `lib/supabase/storage.ts` - uploadDalleImage (permanent image storage)
- `lib/posts/queries.ts` - All CRUD operations (createPost, getUserPosts, getPostById, toggleFavorite, softDeletePost)
- `app/db/schema.ts` - GenerationConfig type, users table

**Provides:**
- REST API for post management (consumed by UI components in plans 06-03 and 06-04)
- Image upload endpoint (DALL-E URL → permanent storage)
- Pagination support (cursor-based for stable results)

## Next Phase Readiness

**Blockers:** None

**Concerns:** None

**Ready for:**
- Plan 06-03: Post History UI Components
- Plan 06-04: Integration with Generation Flow

**Verification needed:**
- Manual testing of all endpoints with authenticated user
- Verify DALL-E image upload works end-to-end
- Test pagination with multiple pages of posts
- Verify favorites filter works correctly

## Next Step

Ready for **06-03-PLAN.md** - Post History UI Components

This plan provides the API foundation. Next plan will build the UI components to consume these endpoints.
