import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPostById, toggleFavorite, softDeletePost } from '@/lib/posts/queries';
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

// Note: Using Node.js runtime (not Edge) because Drizzle with postgres library
// requires Node.js built-ins (net, tls, crypto) not available in Edge runtime

/**
 * GET /api/posts/[id] - Get single post detail
 *
 * Requires authentication.
 * Returns 404 if post not found or doesn't belong to user.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. Parse post ID from route params
    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // 3. Get internal user ID from auth ID
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

    // 4. Get post by ID (includes authorization check - only returns if belongs to user)
    const post = await getPostById(postId, userId);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 5. Return post
    return NextResponse.json(
      { post },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Error in GET /api/posts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/posts/[id] - Toggle favorite status
 *
 * Requires authentication.
 * Returns new favorite state.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. Parse post ID from route params
    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // 3. Get internal user ID from auth ID
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

    // 4. Toggle favorite (includes authorization check)
    let isFavorite: boolean;

    try {
      isFavorite = await toggleFavorite(postId, userId);
    } catch (toggleError) {
      // toggleFavorite throws error if post not found or doesn't belong to user
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 5. Return new favorite state
    return NextResponse.json(
      { isFavorite },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Error in PATCH /api/posts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id] - Soft delete post
 *
 * Requires authentication.
 * Returns 204 No Content on success.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. Parse post ID from route params
    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // 3. Get internal user ID from auth ID
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

    // 4. Soft delete post (includes authorization check)
    await softDeletePost(postId, userId);

    // 5. Return 204 No Content
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Error in DELETE /api/posts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
