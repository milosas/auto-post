import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { getDashboardStats } from '@/lib/dashboard/queries';
import StatCard from '@/app/components/StatCard';
import Link from 'next/link';
import { headers } from 'next/headers';

export default async function DashboardPage() {
  // Authentication check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Get internal user ID (auth ID -> internal ID pattern)
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.authId, user.id))
    .limit(1);

  if (!userResult[0]) {
    redirect('/sign-in');
  }

  const userId = userResult[0].id;

  // Get timezone from headers or default to Lithuania
  const headersList = await headers();
  const timezone = headersList.get('x-timezone') || 'Europe/Vilnius';

  // Fetch dashboard stats
  const stats = await getDashboardStats(userId, timezone);

  // Determine subscription display
  let subscriptionValue: string | number = 'Nemokamas';
  let subscriptionSubtitle: string | undefined = undefined;

  if (stats.subscription?.status === 'active') {
    subscriptionValue = 'Pro';
    subscriptionSubtitle = 'Aktyvus';
  } else if (stats.subscription && stats.subscription.credits > 0) {
    subscriptionValue = stats.subscription.credits;
    subscriptionSubtitle = 'Kreditai';
  } else {
    subscriptionSubtitle = 'Atnaujinti';
  }

  return (
    <div>
      {/* Header section */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Valdymo skydas</h1>
        <Link
          href="/"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Kurti naują įrašą
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {/* Generations today */}
        <StatCard
          title="Sugeneruota šiandien"
          value={stats.generationsToday}
          icon={
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />

        {/* Total posts */}
        <StatCard
          title="Išsaugoti įrašai"
          value={stats.totalPosts}
          icon={
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
        />

        {/* Favorites */}
        <StatCard
          title="Mėgstami"
          value={stats.favorites}
          icon={
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          }
        />

        {/* Subscription status */}
        <Link href="/pricing" className="block">
          <StatCard
            title="Prenumerata"
            value={subscriptionValue}
            subtitle={subscriptionSubtitle}
            icon={
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            }
          />
        </Link>
      </div>
    </div>
  );
}
