import { createClient } from '@/lib/supabase/server'
import { db } from '@/app/db'
import { users } from '@/app/db/schema'
import { eq } from 'drizzle-orm'

export type SyncedUser = {
  id: number
  authId: string
  email: string
  name: string | null
  imageUrl: string | null
}

/**
 * Ensures the authenticated Supabase user exists in our users table.
 * Creates user if not found, returns existing user if found.
 * Returns null if no authenticated user.
 */
export async function syncUser(): Promise<SyncedUser | null> {
  const supabase = await createClient()

  const { data: { user: authUser }, error } = await supabase.auth.getUser()

  if (error || !authUser) {
    return null
  }

  // Check if user exists in our database
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.authId, authUser.id))
    .limit(1)

  if (existingUsers.length > 0) {
    const user = existingUsers[0]
    return {
      id: user.id,
      authId: user.authId,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
    }
  }

  // Create new user
  const newUser = await db
    .insert(users)
    .values({
      authId: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
      imageUrl: authUser.user_metadata?.avatar_url || null,
    })
    .returning()

  const created = newUser[0]
  return {
    id: created.id,
    authId: created.authId,
    email: created.email,
    name: created.name,
    imageUrl: created.imageUrl,
  }
}
