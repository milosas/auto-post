import { syncUser } from '@/lib/auth/sync-user'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const user = await syncUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}
