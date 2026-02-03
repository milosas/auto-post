import { createClient } from '@/lib/supabase/server'
import { syncUser } from '@/lib/auth/sync-user'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Sync user to database after successful OAuth
      try {
        await syncUser()
      } catch (syncError) {
        console.error('User sync error:', syncError)
        // Continue even if sync fails - user can still use the app
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/sign-in?error=auth`)
}
