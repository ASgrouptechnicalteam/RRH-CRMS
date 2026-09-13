import { createHash } from 'crypto';
import { getRedisClient } from '../redis/client';

export interface IdempotencyRecord {
  leadId?: number;
  referenceNumber?: string;
  submissionId?: string;
  status?: 'pending' | 'success';
  createdAt: number;
}

export interface AsyncIdempotencyStore {
  get(key: string): Promise<IdempotencyRecord | undefined>;
  set(key: string, record: IdempotencyRecord): Promise<void>;
  delete(key: string): Promise<void>;
}

export const DEFAULT_IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class MemoryIdempotencyStore implements AsyncIdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord>();

  constructor(private readonly ttlMs: number = DEFAULT_IDEMPOTENCY_TTL_MS) {}

  async get(key: string): Promise<IdempotencyRecord | undefined> {
    const record = this.records.get(key);
    if (!record) return undefined;
    if (Date.now() - record.createdAt > this.ttlMs) {
      this.records.delete(key);
      return undefined;
    }
    return record;
  }

  async set(key: string, record: IdempotencyRecord): Promise<void> {
    this.records.set(key, record);
  }

  async delete(key: string): Promise<void> {
    this.records.delete(key);
  }
}

export class RedisIdempotencyStore implements AsyncIdempotencyStore {
  constructor(private readonly ttlMs: number = DEFAULT_IDEMPOTENCY_TTL_MS) {}

  private get client() {
    return getRedisClient();
  }

  async get(key: string): Promise<IdempotencyRecord | undefined> {
    const redis = this.client;
    if (!redis) {
      console.warn('[Redis] Not configured. Failing open for idempotency GET.');
      return undefined;
    }

    try {
      const data = await redis.get(`sonthillu:idempotency:${key}`);
      if (!data) return undefined;
      return JSON.parse(data) as IdempotencyRecord;
    } catch (error) {
      console.error('[RedisIdempotency] GET Error:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('RedisIdempotency GET failed in production: Failing closed.');
      }
      return undefined;
    }
  }

  async set(key: string, record: IdempotencyRecord): Promise<void> {
    const redis = this.client;
    if (!redis) return;

    try {
      const ttlSeconds = Math.ceil(this.ttlMs / 1000);
      // Atomic SET IF NOT EXISTS with EXPIRE
      await redis.set(
        `sonthillu:idempotency:${key}`,
        JSON.stringify(record),
        'EX',
        ttlSeconds,
        'NX'
      );
    } catch (error) {
      console.error('[RedisIdempotency] SET Error:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('RedisIdempotency SET failed in production: Failing closed.');
      }
    }
  }

  async delete(key: string): Promise<void> {
    const redis = this.client;
    if (!redis) return;

    try {
      await redis.del(`sonthillu:idempotency:${key}`);
    } catch (error) {
      console.error('[RedisIdempotency] DEL Error:', error);
    }
  }
}

/**
 * Deterministic object canonicalization.
 * Ensures that identical payloads with differently ordered keys
 * produce the same string for hashing.
 */
export function canonicalize(obj: unknown): string {
  if (obj === null) return 'null';
  if (typeof obj !== 'object') return String(obj);
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalize).join(',')}]`;
  }

  // Sort keys alphabetically for stable object serialization
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  return `{${keys
    .filter((k) => (obj as Record<string, unknown>)[k] !== undefined) // Ignore undefined
    .map((k) => `"${k}":${canonicalize((obj as Record<string, unknown>)[k])}`)
    .join(',')}}`;
}

/**
 * Derive a stable SHA-256 content-hash key.
 */
export function hashPayload(payload: unknown): string {
  const normalized = canonicalize(payload);
  const hash = createHash('sha256').update(normalized).digest('hex');
  return `hash:${hash}`;
}

export function createIdempotencyStore(ttlMs?: number): AsyncIdempotencyStore {
  // If REDIS_URL is absent in production, we should fail fast at startup/init
  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    throw new Error('REDIS_URL is strictly required in production for idempotency.');
  }

  // Development fallback to memory if Redis is absent
  if (!process.env.REDIS_URL) {
    console.warn(
      '[Idempotency] Using Memory store because REDIS_URL is missing. DO NOT use in production.'
    );
    return new MemoryIdempotencyStore(ttlMs);
  }

  return new RedisIdempotencyStore(ttlMs);
}
