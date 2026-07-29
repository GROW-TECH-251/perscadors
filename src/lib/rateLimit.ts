import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type RateLimitScope = 'admin-login' | 'checkout-api' | 'checkout-order' | 'cloudinary-signature' | 'cloudinary-delete';

const RULES: Record<RateLimitScope, { limit: number; window: Parameters<typeof Ratelimit.slidingWindow>[1] }> = {
  'admin-login': { limit: 5, window: '15 m' },
  'checkout-api': { limit: 10, window: '10 m' },
  'checkout-order': { limit: 5, window: '10 m' },
  'cloudinary-signature': { limit: 20, window: '10 m' },
  'cloudinary-delete': { limit: 10, window: '10 m' }
};

let redis: Redis | null = null;
const limiters = new Map<RateLimitScope, Ratelimit>();

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(scope: RateLimitScope): Ratelimit | null {
  const cached = limiters.get(scope);
  if (cached) return cached;

  const client = getRedis();
  if (!client) return null;

  const rule = RULES[scope];
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(rule.limit, rule.window),
    prefix: `perscadors:ratelimit:${scope}`,
    analytics: false
  });
  limiters.set(scope, limiter);
  return limiter;
}

function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unknown';
}

export async function enforceRateLimit(
  request: Request,
  scope: RateLimitScope,
  discriminator = ''
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const limiter = getLimiter(scope);

  // En production, ne jamais désactiver silencieusement une protection attendue.
  if (!limiter) {
    return { allowed: process.env.NODE_ENV !== 'production', retryAfterSeconds: 60 };
  }

  try {
    const key = `${getClientIp(request)}:${discriminator}`;
    const result = await limiter.limit(key);
    const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return { allowed: result.success, retryAfterSeconds };
  } catch {
    // Redis indisponible : fail closed en production pour les surfaces sensibles.
    return { allowed: process.env.NODE_ENV !== 'production', retryAfterSeconds: 60 };
  }
}
