import { getRedisClient } from '../redis/client';

export interface AsyncRateLimitStore {
  get(key: string): Promise<number[]>;
  set(key: string, timestamps: number[], windowMs: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number | null;
}

export class MemoryRateLimitStore implements AsyncRateLimitStore {
  private readonly buckets = new Map<string, number[]>();

  async get(key: string): Promise<number[]> {
    return this.buckets.get(key) ?? [];
  }

  async set(key: string, timestamps: number[], windowMs: number): Promise<void> {
    this.buckets.set(key, timestamps);
    // Simple memory cleanup
    setTimeout(() => {
      const current = this.buckets.get(key) ?? [];
      const windowStart = Date.now() - windowMs;
      const recent = current.filter((t) => t > windowStart);
      if (recent.length === 0) {
        this.buckets.delete(key);
      } else {
        this.buckets.set(key, recent);
      }
    }, windowMs);
  }

  async delete(key: string): Promise<void> {
    this.buckets.delete(key);
  }
}

export class RedisRateLimitStore implements AsyncRateLimitStore {
  async get(key: string): Promise<number[]> {
    const redis = getRedisClient();
    if (!redis) {
      console.warn('[RedisRateLimit] Not configured. Failing open for GET.');
      return [];
    }

    try {
      const data = await redis.zrange(`sonthillu:ratelimit:${key}`, '0', '-1');
      return data.map(Number);
    } catch (error) {
      console.error('[RedisRateLimit] GET Error:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('RedisRateLimit GET failed in production: Failing closed.');
      }
      return [];
    }
  }

  async set(key: string, timestamps: number[], windowMs: number): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      const now = Date.now();
      const windowStart = now - windowMs;
      const fullKey = `sonthillu:ratelimit:${key}`;

      const pipeline = redis.pipeline();
      // Remove old entries
      pipeline.zremrangebyscore(fullKey, '-inf', windowStart);

      // We only need to add the newest timestamp to the sorted set,
      // as `recent` already exists in Redis.
      if (timestamps.length > 0) {
        const newest = timestamps[timestamps.length - 1];
        pipeline.zadd(fullKey, String(newest), String(newest));
      }

      pipeline.pexpire(fullKey, windowMs);
      await pipeline.exec();
    } catch (error) {
      console.error('[RedisRateLimit] SET Error:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('RedisRateLimit SET failed in production: Failing closed.');
      }
    }
  }

  async delete(key: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      await redis.del(`sonthillu:ratelimit:${key}`);
    } catch (error) {
      console.error('[RedisRateLimit] DEL Error:', error);
    }
  }
}

export function createAsyncRateLimitStore(): AsyncRateLimitStore {
  if (!process.env.REDIS_URL) {
    console.warn(
      '[RateLimit] REDIS_URL not set — using in-memory store. Not suitable for multi-instance production.'
    );
    return new MemoryRateLimitStore();
  }

  return new RedisRateLimitStore();
}

export function createRateLimiter(
  options: RateLimiterOptions,
  store: AsyncRateLimitStore = createAsyncRateLimitStore()
) {
  const { windowMs, max, keyPrefix = '' } = options;

  function fullKey(key: string): string {
    return `${keyPrefix}${key}`;
  }

  return {
    async check(key: string, now: number = Date.now()): Promise<RateLimitResult> {
      const windowStart = now - windowMs;
      const bucketKey = fullKey(key);
      const timestamps = await store.get(bucketKey);
      const recent = timestamps.filter((t) => t > windowStart);

      if (recent.length >= max) {
        const oldest = recent[0];
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(0, oldest + windowMs - now),
        };
      }

      await store.set(bucketKey, [...recent, now], windowMs);
      return {
        allowed: true,
        remaining: max - recent.length - 1,
        retryAfterMs: null,
      };
    },
    async reset(key: string): Promise<void> {
      await store.delete(fullKey(key));
    },
  };
}
