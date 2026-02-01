'use client';

import { useState, useEffect } from 'react';
import { differenceInSeconds, intervalToDuration } from 'date-fns';

export function useCountdown(resetAt: Date | string | null) {
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!resetAt) {
      setCountdown('');
      return;
    }

    const targetDate = typeof resetAt === 'string' ? new Date(resetAt) : resetAt;

    const updateCountdown = () => {
      const now = new Date();
      const secondsRemaining = differenceInSeconds(targetDate, now);

      if (secondsRemaining <= 0) {
        setCountdown('Atsinaujina dabar');
        return;
      }

      const duration = intervalToDuration({ start: now, end: targetDate });
      const hours = duration.hours || 0;
      const minutes = duration.minutes || 0;

      if (hours > 0) {
        setCountdown(`Atsinaujins po ${hours}h ${minutes}m`);
      } else {
        setCountdown(`Atsinaujins po ${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [resetAt]);

  return countdown;
}
