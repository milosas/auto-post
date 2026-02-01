'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UsageCounter } from './UsageCounter'

export default function AuthHeader() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<{ used: number; limit: number; resetAt: string } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      // Fetch usage for logged-in users
      if (user) {
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
          const response = await fetch('/api/usage', {
            headers: { 'X-Timezone': timezone },
          });
          if (response.ok) {
            const data = await response.json();
            setUsage(data);
          }
        } catch (error) {
          console.error('Failed to fetch usage:', error);
        }
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Fetch usage on login
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
          const response = await fetch('/api/usage', {
            headers: { 'X-Timezone': timezone },
          });
          if (response.ok) {
            const data = await response.json();
            setUsage(data);
          }
        } catch (error) {
          console.error('Failed to fetch usage:', error);
        }
      } else {
        setUsage(null);
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-8 w-20 animate-pulse rounded bg-gray-200"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        {/* Usage counter for free users */}
        {usage && (
          <UsageCounter
            used={usage.used}
            limit={usage.limit}
            resetAt={usage.resetAt}
          />
        )}

        {/* Existing user avatar and sign out button */}
        <div className="flex items-center gap-2">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
              {(user.email?.[0] || '?').toUpperCase()}
            </div>
          )}
          <span className="hidden text-sm text-gray-700 sm:inline">
            {user.user_metadata?.full_name || user.email?.split('@')[0]}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Atsijungti
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/sign-in"
        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        Prisijungti
      </Link>
      <Link
        href="/sign-up"
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Registruotis
      </Link>
    </div>
  )
}
