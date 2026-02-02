import Link from 'next/link';
import AuthHeader from '@/app/components/AuthHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side: Navigation links */}
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-gray-900 font-semibold hover:text-gray-700 transition-colors"
              >
                Valdymo skydas
              </Link>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Kurti įrašą
              </Link>
              <Link
                href="/history"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Istorija
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Kainos
              </Link>
            </div>

            {/* Right side: AuthHeader */}
            <div className="flex items-center">
              <AuthHeader />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
