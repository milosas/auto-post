import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Singleton - instantiate outside handler for connection caching
export const dailyLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, '24 h'),
  analytics: true,
  prefix: 'ratelimit:daily',
});
