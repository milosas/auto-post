'use client';

import { useState, useEffect } from 'react';
import { useCountdown } from '@/lib/usage/countdown';
import type { UserAccess } from '@/lib/stripe/subscriptions';

interface UsageCounterProps {
  used: number;
  limit: number;
  resetAt: string; // ISO string from API
}

export function UsageCounter({ used, limit, resetAt }: UsageCounterProps) {
  const countdown = useCountdown(resetAt);
  const [access, setAccess] = useState<UserAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');

      if (response.status === 401) {
        // User not authenticated - show free tier usage
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

  // If loading, show skeleton
  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // If user has subscription, show monthly usage
  if (access?.type === 'subscription') {
    if (access.unlimited) {
      return (
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
          <span className="text-sm font-medium text-gray-700">Neribota</span>
        </div>
      );
    }

    const percentage = Math.min(((access.used || 0) / (access.quota || 1)) * 100, 100);

    const getColorClass = () => {
      if (percentage >= 100) return 'bg-red-500';
      if (percentage >= 66) return 'bg-yellow-500';
      if (percentage >= 33) return 'bg-blue-500';
      return 'bg-green-500';
    };

    const colorClass = getColorClass();

    return (
      <div className="flex items-center gap-3">
        {/* Progress bar */}
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${colorClass}`}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={access.used}
            aria-valuemin={0}
            aria-valuemax={access.quota}
          />
        </div>

        {/* Text counter */}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            {access.used}/{access.quota} šį mėnesį
          </span>
        </div>
      </div>
    );
  }

  // If user has credits, show credit balance
  if (access?.type === 'credits') {
    return (
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-purple-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          Kreditai: {access.credits}
        </span>
      </div>
    );
  }

  // Free tier - show daily usage (original behavior)
  const percentage = Math.min((used / limit) * 100, 100);

  const getColorClass = () => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 66) return 'bg-yellow-500';
    if (percentage >= 33) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const colorClass = getColorClass();

  return (
    <div className="flex items-center gap-3">
      {/* Progress bar */}
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
        />
      </div>

      {/* Text counter */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700">
          {used}/{limit} šiandien
        </span>
        {used >= limit && countdown && (
          <span className="text-xs text-gray-500">{countdown}</span>
        )}
      </div>
    </div>
  );
}
