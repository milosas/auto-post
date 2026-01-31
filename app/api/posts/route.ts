import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadDalleImage } from '@/lib/supabase/storage';
import { createPost, getUserPosts } from '@/lib/posts/queries';
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import type { GenerationConfig } from '@/app/db/schema';

// Note: Using Node.js runtime (not Edge) because Drizzle with postgres library
// requires Node.js built-ins (net, tls, crypto) not available in Edge runtime

// Request body type for POST
interface SavePostRequest {
  text: string;
  dalleImageUrl?: string; // Temporary DALL-E URL (will be re-uploaded)
  config: GenerationConfig;
}

/**
 * POST /api/posts - Save a new post
 *
 * Requires authentication.
 * Uploads DALL-E image to permanent storage if provided.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: SavePostRequest = await request.json();

    // 3. Validate required fields
    if (!body.text || !body.config) {
      return NextResponse.json(
        { error: 'Missing required fields: text and config are required' },
        { status: 400 }
      );
    }

    // 4. Get internal user ID from auth ID
    const internalUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, authUser.id))
      .limit(1);

    if (!internalUser || internalUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const userId = internalUser[0].id;

    // 5. Upload DALL-E image to permanent storage if provided
    let permanentImageUrl: string | null = null;

    if (body.dalleImageUrl) {
      try {
        permanentImageUrl = await uploadDalleImage(
          body.dalleImageUrl,
          userId.toString(),
          Date.now().toString()
        );
      } catch (uploadError) {
        console.error('Failed to upload DALL-E image:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload image to storage' },
          { status: 500 }
        );
      }
    }

    // 6. Create post
    const { id: postId } = await createPost(
      userId,
      body.text,
      permanentImageUrl,
      body.config
    );

    // 7. Return success with post ID
    return NextResponse.json(
      { postId },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Error in POST /api/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/posts - List user's posts with pagination
 *
 * Requires authentication.
 * Query params: cursor (number), search (string), favorites (boolean)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get internal user ID from auth ID
    const internalUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, authUser.id))
      .limit(1);

    if (!internalUser || internalUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const userId = internalUser[0].id;

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const cursorParam = searchParams.get('cursor');
    const searchParam = searchParams.get('search');
    const favoritesParam = searchParams.get('favorites');

    const cursor = cursorParam ? parseInt(cursorParam, 10) : undefined;
    const search = searchParam || undefined;
    const favorites = favoritesParam === 'true';

    // 4. Get user posts
    const { posts, nextCursor } = await getUserPosts(
      userId,
      cursor,
      search,
      favorites
    );

    // 5. Return posts with next cursor
    return NextResponse.json(
      { posts, nextCursor },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Error in GET /api/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
