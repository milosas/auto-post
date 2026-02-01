'use client';

import { useCountdown } from '@/lib/usage/countdown';

interface UsageCounterProps {
  used: number;
  limit: number;
  resetAt: string; // ISO string from API
}

export function UsageCounter({ used, limit, resetAt }: UsageCounterProps) {
  const countdown = useCountdown(resetAt);

  // Calculate percentage and clamp to 100
  const percentage = Math.min((used / limit) * 100, 100);

  // Determine color based on usage level
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
