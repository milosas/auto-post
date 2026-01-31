# Phase 6: Post History - Research

**Researched:** 2026-01-31
**Domain:** Post persistence, image storage, list UI patterns with Supabase/Drizzle
**Confidence:** HIGH

## Summary

Phase 6 implements post history features allowing users to save, view, search, and manage their generated social media posts. The critical finding is that **DALL-E image URLs expire after 60 minutes**, which necessitates downloading and storing images to persistent storage immediately after generation.

The research confirms:
1. DALL-E URLs expire after 60 minutes (verified from OpenAI API documentation)
2. Supabase Storage is the recommended choice for this project (unified with existing Supabase DB/Auth)
3. Simple ILIKE search is sufficient for Phase 6 (full-text search is overkill for MVP)
4. Manual save with explicit "Save Post" button is recommended (auto-save inappropriate for content generation)
5. Cursor-based pagination with infinite scroll provides best UX for post lists
6. Regeneration should reuse the existing streaming infrastructure from Phase 2

**Primary recommendation:** Download DALL-E images immediately upon generation and store in Supabase Storage. Use manual save flow with explicit user action. Implement infinite scroll with react-intersection-observer and simple ILIKE search.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.93.3 (installed) | Storage client + database | Already in stack, unified auth/db/storage |
| `drizzle-orm` | 0.45.1 (installed) | Database queries | Already in stack, type-safe queries |
| `react-intersection-observer` | Latest | Infinite scroll detection | Lightweight, React 19 compatible, widely adopted |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | Latest | Date formatting | Display "2 days ago" in post list |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Storage | Cloudflare R2 | R2 has zero egress but adds complexity (separate service, AWS SDK). Use R2 only if storage costs become significant |
| ILIKE search | PostgreSQL full-text search | Full-text adds complexity (tsvector columns, GIN indexes). ILIKE sufficient for text search MVP |
| Infinite scroll | Traditional pagination | Pagination better for SEO but this is auth-only page, no SEO needed |
| Manual save | Auto-save | Auto-save inappropriate for AI generation (user may not want every attempt saved) |

**Installation:**
```bash
npm install react-intersection-observer date-fns
```

## Architecture Patterns

### Recommended Project Structure

```
app/
├── history/
│   ├── page.tsx              # Post history list page (Server Component)
│   └── [id]/
│       └── page.tsx          # Individual post detail page
├── api/
│   ├── posts/
│   │   └── route.ts          # POST (save), GET (list with pagination)
│   ├── posts/[id]/
│   │   └── route.ts          # GET (detail), DELETE (soft delete)
│   └── upload-image/
│       └── route.ts          # Upload DALL-E image to Supabase Storage
├── components/
│   ├── PostHistoryList.tsx   # Client component with infinite scroll
│   ├── PostCard.tsx          # Post card for list display
│   ├── SavePostButton.tsx    # Save button for generation page
│   └── FavoriteButton.tsx    # Toggle favorite status
lib/
├── supabase/
│   └── storage.ts            # Supabase Storage helpers
└── posts/
    └── queries.ts            # Drizzle query helpers for posts
```

### Pattern 1: Download and Store DALL-E Image Immediately

**What:** Fetch DALL-E URL and upload to Supabase Storage before URL expires
**When to use:** Every time a DALL-E image is generated
**Critical:** Must happen within 60 minutes of generation (recommend immediate)

**Example:**
```typescript
// Source: Supabase Storage docs + OpenAI API research
// lib/supabase/storage.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for server-side uploads
);

export async function uploadDalleImage(
  dalleUrl: string,
  userId: string,
  postId: number
): Promise<string> {
  // 1. Fetch the image from DALL-E URL (expires in 60 min)
  const response = await fetch(dalleUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch DALL-E image');
  }

  const imageBlob = await response.blob();
  const fileName = `${userId}/${postId}-${Date.now()}.png`;

  // 2. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('post-images')
    .upload(fileName, imageBlob, {
      contentType: 'image/png',
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // 3. Get public URL (permanent, never expires)
  const { data: { publicUrl } } = supabase.storage
    .from('post-images')
    .getPublicUrl(data.path);

  return publicUrl;
}
```

### Pattern 2: Manual Save with Explicit Button

**What:** User clicks "Save Post" button to persist generated content
**When to use:** After successful generation, before leaving page

**Example:**
```typescript
// Source: UX research on auto-save patterns
// app/components/SavePostButton.tsx
'use client';

import { useState } from 'react';

interface SavePostButtonProps {
  text: string;
  imageUrl?: string; // DALL-E URL (temporary)
  config: GenerationConfig;
  onSaved?: (postId: number) => void;
}

export function SavePostButton({ text, imageUrl, config, onSaved }: SavePostButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, dalleImageUrl: imageUrl, config }),
      });

      if (!response.ok) throw new Error('Save failed');

      const { postId } = await response.json();
      setSaved(true);
      onSaved?.(postId);
    } catch (error) {
      console.error('Save error:', error);
      // Show toast error
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving || saved}
      className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
    >
      {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Post'}
    </button>
  );
}
```

### Pattern 3: Infinite Scroll with react-intersection-observer

**What:** Load more posts when user scrolls to bottom
**When to use:** Post history list page

**Example:**
```typescript
// Source: react-intersection-observer + Next.js Server Actions
// app/components/PostHistoryList.tsx
'use client';

import { useInView } from 'react-intersection-observer';
import { useEffect, useState, useTransition } from 'react';
import { loadMorePosts } from '@/app/actions/posts';

interface Post {
  id: number;
  text: string;
  imageUrl: string | null;
  createdAt: Date;
  isFavorite: number;
}

interface PostHistoryListProps {
  initialPosts: Post[];
  initialCursor: number | null;
}

export function PostHistoryList({ initialPosts, initialCursor }: PostHistoryListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [cursor, setCursor] = useState<number | null>(initialCursor);
  const [isPending, startTransition] = useTransition();

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && cursor && !isPending) {
      startTransition(async () => {
        const { posts: newPosts, nextCursor } = await loadMorePosts(cursor);
        setPosts(prev => [...prev, ...newPosts]);
        setCursor(nextCursor);
      });
    }
  }, [inView, cursor, isPending]);

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}

      {cursor && (
        <div ref={ref} className="h-10 flex items-center justify-center">
          {isPending && <span>Loading...</span>}
        </div>
      )}
    </div>
  );
}
```

### Pattern 4: Cursor-Based Pagination for Posts

**What:** Use last post ID as cursor instead of offset
**When to use:** All paginated post queries

**Example:**
```typescript
// Source: Drizzle ORM docs
// lib/posts/queries.ts

import { db } from '@/app/db';
import { posts } from '@/app/db/schema';
import { eq, isNull, desc, lt, and, ilike, or } from 'drizzle-orm';

const PAGE_SIZE = 20;

export async function getUserPosts(
  userId: number,
  cursor?: number,
  search?: string,
  favoritesOnly?: boolean
) {
  const conditions = [
    eq(posts.userId, userId),
    isNull(posts.deletedAt),
  ];

  if (cursor) {
    conditions.push(lt(posts.id, cursor));
  }

  if (favoritesOnly) {
    conditions.push(eq(posts.isFavorite, 1));
  }

  if (search) {
    conditions.push(ilike(posts.text, `%${search}%`));
  }

  const results = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.id))
    .limit(PAGE_SIZE + 1); // Fetch one extra to check if more exist

  const hasMore = results.length > PAGE_SIZE;
  const postsToReturn = hasMore ? results.slice(0, PAGE_SIZE) : results;
  const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1].id : null;

  return {
    posts: postsToReturn,
    nextCursor,
  };
}
```

### Pattern 5: ILIKE Search for Post Text

**What:** Case-insensitive substring search using ILIKE
**When to use:** Post search feature (HIST-06)

**Example:**
```typescript
// Source: Drizzle ORM docs - Select
import { ilike } from 'drizzle-orm';

// Simple search
const searchResults = await db
  .select()
  .from(posts)
  .where(
    and(
      eq(posts.userId, userId),
      isNull(posts.deletedAt),
      ilike(posts.text, `%${searchTerm}%`)
    )
  )
  .orderBy(desc(posts.createdAt))
  .limit(20);
```

### Pattern 6: Toggle Favorite with Optimistic Update

**What:** Immediately update UI, then sync to database
**When to use:** Favorite/unfavorite button

**Example:**
```typescript
// Source: React patterns
// app/components/FavoriteButton.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { toggleFavorite } from '@/app/actions/posts';

export function FavoriteButton({ postId, initialFavorite }: { postId: number; initialFavorite: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(initialFavorite);

  const handleToggle = () => {
    startTransition(async () => {
      setOptimisticFavorite(!optimisticFavorite);
      await toggleFavorite(postId);
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={optimisticFavorite ? 'text-yellow-500' : 'text-gray-400'}
    >
      {optimisticFavorite ? 'Favorited' : 'Add to Favorites'}
    </button>
  );
}
```

### Anti-Patterns to Avoid

- **Don't store DALL-E URLs directly:** They expire in 60 minutes. Always download and re-upload to permanent storage.
- **Don't use auto-save for generated content:** Users may generate multiple attempts and only want to save the best one.
- **Don't use offset-based pagination:** Performance degrades with large offsets. Use cursor-based pagination.
- **Don't implement full-text search for MVP:** ILIKE is sufficient for simple text search. Full-text adds unnecessary complexity.
- **Don't forget soft delete filter:** Always include `isNull(posts.deletedAt)` in queries.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Intersection detection | Manual scroll listeners | `react-intersection-observer` | Handles edge cases, debouncing, cleanup |
| Image storage | Direct file system | Supabase Storage | CDN, permissions, consistent with existing stack |
| Date formatting | Manual date math | `date-fns` | Handles localization, relative time, edge cases |
| Optimistic updates | Manual state juggling | React `useOptimistic` | Built into React 19, handles rollback |
| Pagination state | Custom hooks | Server Actions + cursor | Simpler, works with React 19 transitions |

**Key insight:** Post history is a standard CRUD feature. Resist over-engineering. The complexity is in image storage timing (DALL-E expiration), not in the list/search/favorite features.

## Common Pitfalls

### Pitfall 1: DALL-E Image URL Expiration

**What goes wrong:** Saved posts show broken images after 60 minutes
**Why it happens:** DALL-E URLs are temporary signed URLs that expire

**How to avoid:**
1. Download image immediately after generation
2. Upload to Supabase Storage before saving post
3. Store the Supabase Storage URL (permanent) in database, not DALL-E URL

**Warning signs:**
- Images work initially, break later
- Random broken images in history
- 403/404 errors from DALL-E URLs

**Source:** [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/images/) - "URLs are only valid for 60 minutes"

### Pitfall 2: Missing Soft Delete Filter

**What goes wrong:** Deleted posts appear in history, favorites count wrong
**Why it happens:** Forgot to add `isNull(deletedAt)` to query

**How to avoid:**
```typescript
// WRONG: Missing soft delete filter
const posts = await db.select().from(posts).where(eq(posts.userId, userId));

// CORRECT: Always filter deleted posts
const posts = await db.select().from(posts).where(
  and(eq(posts.userId, userId), isNull(posts.deletedAt))
);
```

**Warning signs:**
- Post count doesn't match visible posts
- Deleted posts reappear
- Data inconsistencies

### Pitfall 3: N+1 Query on Post List

**What goes wrong:** Slow page load, many database queries
**Why it happens:** Fetching user info separately for each post

**How to avoid:**
- Posts already have `userId`, user info not needed in list
- If user info needed, use Drizzle relations with `with` clause
- Batch queries instead of per-item queries

**Warning signs:**
- Slow history page load
- Many database queries per page view
- Performance degrades with more posts

### Pitfall 4: Search Injection

**What goes wrong:** SQL injection via search input
**Why it happens:** Concatenating user input directly into queries

**How to avoid:**
```typescript
// WRONG: Direct concatenation
const results = await db.execute(sql`SELECT * FROM posts WHERE text LIKE '%${search}%'`);

// CORRECT: Drizzle parameterized query
const results = await db.select().from(posts).where(ilike(posts.text, `%${search}%`));
```

Drizzle's `ilike` function automatically escapes the input.

**Warning signs:**
- Unusual search queries causing errors
- Security scan findings

### Pitfall 5: Large Image Uploads Blocking UI

**What goes wrong:** UI freezes during image upload
**Why it happens:** Synchronous upload in main thread

**How to avoid:**
- Show immediate "Saving..." feedback
- Upload image in background
- Handle errors gracefully with retry option

**Warning signs:**
- Button stays pressed for seconds
- No visual feedback during save
- Users clicking multiple times

## Code Examples

Verified patterns from official sources:

### Save Post API Route

```typescript
// Source: Supabase Storage docs + Drizzle patterns
// app/api/posts/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { posts, users } from '@/app/db/schema';
import { eq, isNull, desc, and, lt } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { uploadDalleImage } from '@/lib/supabase/storage';

export const runtime = 'edge';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { text, dalleImageUrl, config } = body;

  // Get internal user ID
  const [dbUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authId, user.id));

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Upload DALL-E image to permanent storage (if provided)
  let permanentImageUrl: string | null = null;
  if (dalleImageUrl) {
    // Note: postId not known yet, use temp ID
    permanentImageUrl = await uploadDalleImage(
      dalleImageUrl,
      dbUser.id.toString(),
      Date.now()
    );
  }

  // Insert post
  const [newPost] = await db
    .insert(posts)
    .values({
      userId: dbUser.id,
      text,
      imageUrl: permanentImageUrl,
      config,
    })
    .returning({ id: posts.id });

  return NextResponse.json({ postId: newPost.id });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const search = searchParams.get('search');
  const favorites = searchParams.get('favorites') === 'true';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get internal user ID
  const [dbUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authId, user.id));

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const result = await getUserPosts(
    dbUser.id,
    cursor ? parseInt(cursor) : undefined,
    search || undefined,
    favorites
  );

  return NextResponse.json(result);
}
```

### Supabase Storage Setup

```sql
-- Source: Supabase Storage docs
-- Run in Supabase SQL Editor

-- Create bucket for post images (public readable)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all images
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Regenerate Post Server Action

```typescript
// Source: Existing streaming pattern from Phase 2
// app/actions/posts.ts
'use server';

import { db } from '@/app/db';
import { posts } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function regenerateFromPost(postId: number) {
  const [post] = await db
    .select({ config: posts.config })
    .from(posts)
    .where(eq(posts.id, postId));

  if (!post) {
    throw new Error('Post not found');
  }

  // Redirect to generation page with config as query params
  const params = new URLSearchParams({
    industry: post.config.industry,
    topic: post.config.topic,
    tone: post.config.tone,
    length: post.config.length.toString(),
    emoji: post.config.emoji.toString(),
    ...(post.config.imageStyle && { imageStyle: post.config.imageStyle }),
  });

  redirect(`/?${params.toString()}`);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Store DALL-E URLs | Download + re-upload immediately | Always required (URLs expire) | Prevents broken images |
| Offset pagination | Cursor-based pagination | 2020+ for large lists | Better performance at scale |
| Manual scroll listeners | Intersection Observer API | 2019+ (widely supported) | Cleaner code, better performance |
| Auto-save everything | Manual save for generated content | UX best practice | User control over what's saved |
| Full-text search | ILIKE for MVP | Start simple, upgrade later | Faster implementation |

**Deprecated/outdated:**
- **Storing DALL-E URLs directly**: URLs expire in 60 minutes, always re-upload
- **Offset-based pagination for infinite scroll**: Performance issues with large offsets
- **Custom scroll event handlers**: Use Intersection Observer instead

## Open Questions

Things that couldn't be fully resolved:

1. **Supabase Storage file size limits**
   - What we know: Standard uploads support up to 5GB, recommend TUS for >6MB
   - What's unclear: Exact limits for free tier, whether DALL-E PNG sizes fit standard upload
   - Recommendation: DALL-E 1024x1024 PNGs are typically 1-3MB, standard upload should work

2. **Image optimization/thumbnails**
   - What we know: Supabase Storage can transform images on-the-fly
   - What's unclear: Whether transformation is included in pricing, latency impact
   - Recommendation: Store original, use Next.js Image component for optimization

3. **Concurrent save race condition**
   - What we know: User might click save multiple times
   - What's unclear: Whether Drizzle/Supabase handles this gracefully
   - Recommendation: Disable save button after first click, add debounce

## Sources

### Primary (HIGH confidence)

- [OpenAI Images API Reference](https://platform.openai.com/docs/api-reference/images/) - URL expiration: 60 minutes
- [Supabase Storage Upload Reference](https://supabase.com/docs/reference/javascript/storage-from-upload)
- [Drizzle ORM Select Documentation](https://orm.drizzle.team/docs/select) - ILIKE, orderBy, limit, offset
- [Drizzle ORM PostgreSQL Full-Text Search](https://orm.drizzle.team/docs/guides/postgresql-full-text-search)
- [react-intersection-observer npm](https://www.npmjs.com/package/react-intersection-observer)

### Secondary (MEDIUM confidence)

- [Auto-save vs Manual Save UX Patterns](https://medium.com/@brooklyndippo/to-save-or-to-autosave-autosaving-patterns-in-modern-web-applications-39c26061aa6b)
- [Infinite Scroll in Next.js with Server Actions](https://medium.com/@ferlat.simon/infinite-scroll-with-nextjs-server-actions-a-simple-guide-76a894824cfd)
- [Implementing Infinite Scroll in Next.js](https://blog.devops.dev/implementing-infinite-scroll-in-next-js-a-complete-guide-0ce74d5eb57d)
- [Supabase Storage Guide for Next.js](https://supalaunch.com/blog/supabase-storage-guide-for-nextjs)

### Tertiary (LOW confidence)

- [DALL-E API Image URL lifetime discussion](https://community.openai.com/t/dall-e-api-image-url-lifetime/53672)
- [Cloudflare R2 vs Supabase comparison](https://medium.com/@vishalsharma05052002/how-i-saved-300-year-by-migrating-from-supabase-storage-to-cloudflare-r2-f503d57b0732)

## Metadata

**Confidence breakdown:**
- DALL-E expiration: HIGH - Verified from official OpenAI API documentation
- Supabase Storage: HIGH - Official Supabase documentation
- Drizzle queries: HIGH - Official Drizzle ORM documentation
- Infinite scroll: MEDIUM - Community patterns, well-established
- UX patterns: MEDIUM - Multiple credible UX sources agree

**Research date:** 2026-01-31
**Valid until:** 2026-03-01 (30 days, stable patterns)
**Next review needed:** If OpenAI changes image API or Supabase Storage API changes
