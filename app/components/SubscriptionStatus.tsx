'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserAccess } from '@/lib/stripe/subscriptions';

export function SubscriptionStatus() {
  const router = useRouter();
  const [access, setAccess] = useState<UserAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');

      if (response.status === 401) {
        // User not authenticated
        setAccess(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        console.error('Failed to fetch subscription status');
        setLoading(false);
        return;
      }

      const data: UserAccess = await response.json();
      setAccess(data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Klaida: ${error.error || 'Nepavyko atidaryti klientų portalo'}`);
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Įvyko klaida. Bandykite dar kartą.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleBuyCredits = () => {
    router.push('/pricing');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-8 bg-gray-200 rounded w-3/4" />
      </div>
    );
  }

  if (!access) {
    // User not authenticated - don't show anything
    return null;
  }

  const getPlanName = () => {
    if (access.type === 'subscription') {
      if (access.unlimited) return 'Unlimited';
      if (access.quota === 30) return 'Starter';
      if (access.quota === 70) return 'Pro';
      return 'Prenumerata';
    }
    if (access.type === 'credits') {
      return 'Kreditai';
    }
    return 'Nemokamas';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('lt-LT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Jūsų planas
      </h3>

      {/* Plan name */}
      <div className="mb-4">
        <div className="text-2xl font-bold text-blue-600">
          {getPlanName()}
        </div>
      </div>

      {/* Subscription details */}
      {access.type === 'subscription' && (
        <div className="space-y-3 mb-6">
          {access.unlimited ? (
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Neribota generacijų</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <div className="flex justify-between mb-1">
                <span>Panaudota šį mėnesį:</span>
                <span className="font-medium">
                  {access.used}/{access.quota}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      ((access.used || 0) / (access.quota || 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {access.periodEnd && (
            <div className="text-sm text-gray-600">
              <span>Atsinaujina: </span>
              <span className="font-medium">{formatDate(access.periodEnd)}</span>
            </div>
          )}
        </div>
      )}

      {/* Credit balance */}
      {access.type === 'credits' && (
        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-1">Kreditų likutis:</div>
          <div className="text-3xl font-bold text-purple-600">
            {access.credits}
          </div>
        </div>
      )}

      {/* Free tier */}
      {access.type === 'free' && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Atnaujinkite planą, kad gautumėte daugiau generacijų ir funkcijų.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {access.type === 'subscription' && (
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {portalLoading ? 'Kraunasi...' : 'Valdyti prenumeratą'}
          </button>
        )}

        {(access.type === 'credits' || access.type === 'free') && (
          <button
            onClick={handleBuyCredits}
            className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
          >
            {access.type === 'credits' ? 'Pirkti daugiau kreditų' : 'Peržiūrėti planus'}
          </button>
        )}
      </div>
    </div>
  );
}
