import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Redis is configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Singleton - instantiate outside handler for connection caching
// Returns null if Redis not configured (rate limiting disabled)
export const dailyLimit = isRedisConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(50, '24 h'),
      analytics: true,
      prefix: 'ratelimit:daily',
    })
  : null;
