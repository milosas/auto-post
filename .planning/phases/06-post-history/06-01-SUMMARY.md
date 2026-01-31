---
phase: 06-post-history
plan: 01
subsystem: database
tags: [supabase-storage, drizzle-orm, dalle, pagination, cursor-based]

# Dependency graph
requires:
  - phase: 04-database-foundation
    provides: Posts table schema with soft delete and indexes
  - phase: 05-authentication
    provides: Supabase client setup for server-side operations
provides:
  - Supabase Storage helper for DALL-E image persistence
  - Drizzle query helpers for posts CRUD with cursor pagination
  - Search and favorites filtering
affects: [06-02, 06-03, 06-04, post-management, image-generation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cursor-based pagination with PAGE_SIZE + 1 trick"
    - "Soft delete filtering with isNull(deletedAt) on all queries"
    - "User authorization checking on all mutations"
    - "DALL-E URL expiration handling via immediate re-upload"

key-files:
  created:
    - lib/supabase/storage.ts
    - lib/posts/queries.ts
  modified: []

key-decisions:
  - "Use Supabase Storage service role key for server-side uploads (bypasses RLS)"
  - "PAGE_SIZE = 20 for post pagination"
  - "ILIKE for case-insensitive search (PostgreSQL-specific)"
  - "Cursor pagination using id DESC ordering (newest first)"

patterns-established:
  - "Storage pattern: download DALL-E URL → upload to permanent storage → return public URL"
  - "Query pattern: all queries filter isNull(deletedAt) for soft delete"
  - "Security pattern: all mutations check userId for authorization"
  - "Pagination pattern: fetch PAGE_SIZE + 1 to detect hasMore"

# Metrics
duration: 3min
completed: 2026-01-31
---

# Phase 6 Plan 1: Storage and Query Helpers Summary

**Supabase Storage helper for DALL-E image persistence and Drizzle query helpers for posts CRUD with cursor-based pagination**

## Performance

- **Duration:** 3 minutes
- **Started:** 2026-01-31T07:54:53Z
- **Completed:** 2026-01-31T07:57:31Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `uploadDalleImage` function to handle DALL-E URL expiration (60-minute limit)
- Implemented 5 Drizzle query helpers: getUserPosts, getPostById, createPost, toggleFavorite, softDeletePost
- Established cursor-based pagination pattern with search and favorites filtering
- Added comprehensive security checks (userId authorization on all mutations)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Supabase Storage helper for DALL-E images** - `556f663` (feat)
2. **Task 2: Create Drizzle query helpers for posts** - `5f992cd` (feat)

## Files Created/Modified
- `lib/supabase/storage.ts` - Downloads DALL-E images and uploads to Supabase Storage bucket 'post-images'
- `lib/posts/queries.ts` - Drizzle query helpers for posts CRUD with cursor pagination, search, and favorites filtering

## Decisions Made

**STORAGE-01: Service role key for uploads**
- Used `SUPABASE_SERVICE_ROLE_KEY` instead of user-scoped client for server-side uploads
- Rationale: Bypasses RLS policies, allows server to upload on behalf of any user
- Trade-off: Must validate userId in application logic (already done in createPost)

**PAGINATION-01: Cursor-based over offset-based**
- Used cursor pagination with `id < cursor` pattern
- Rationale: Stable pagination even when new posts are added, better performance at scale
- PAGE_SIZE = 20 (industry standard for social media feeds)

**SEARCH-01: ILIKE for case-insensitive search**
- Used PostgreSQL ILIKE operator for text search
- Rationale: Simple implementation, sufficient for v2.0 launch
- Future: Consider full-text search (ts_vector) if performance becomes issue

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation was straightforward.

## User Setup Required

**External services require manual configuration:**

1. **Supabase Storage bucket creation:**
   - Go to Supabase Dashboard → Storage
   - Create new bucket named `post-images`
   - Set as public bucket (images need public URLs)
   - No RLS policies needed (service role key bypasses RLS)

2. **Environment variable:**
   - Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
   - Get from Supabase Dashboard → Settings → API → service_role key
   - **WARNING:** Keep this secret - service role key bypasses all RLS policies

**Verification:**
```bash
# After setup, test upload (will be implemented in 06-02):
# - Generate post with DALL-E image
# - Check Supabase Storage dashboard for uploaded file in post-images bucket
```

## Next Phase Readiness

**Ready for 06-02 (Create Post API):**
- Storage helper available for DALL-E image uploads
- createPost query helper ready for database insertion
- Pattern established for handling image URLs

**Ready for 06-03 (Post History UI):**
- getUserPosts query helper ready for infinite scroll
- Search and favorites filtering implemented
- Cursor pagination pattern ready for frontend integration

**Blockers/Concerns:**
- DALL-E URL expiration policy needs verification (30-90 days vs 60 minutes claimed in research)
- Supabase Storage public bucket has no built-in CDN - may need Cloudflare R2 for production if bandwidth becomes issue

---
*Phase: 06-post-history*
*Completed: 2026-01-31*
