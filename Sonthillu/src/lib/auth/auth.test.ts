import { describe, it, expect } from 'vitest';
import {
  BRAND_AUTH_SCOPE,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_ATTRIBUTES,
  brandSessionCookieName,
  isSonthilluSessionCookie,
} from './brand';
import { identityInputSchema, profileUpdateSchema } from './schemas';
import {
  computeSessionExpiry,
  isSessionActive,
  isSessionExpired,
  isSessionRevoked,
  assertCustomerOwns,
  SESSION_DEFAULT_TTL_MS,
  SESSION_MAX_TTL_MS,
  UnauthorizedAccessError,
} from './session-core';
import { createRateLimiter, MemoryRateLimitStore } from './ratelimit';
import { sanitizeForLog, isSensitiveKey } from './privacy';
import type { Session } from '../../types/auth';

function makeSession(overrides: Partial<Session>): Session {
  return {
    id: 'sess_1',
    customerId: 1,
    createdAt: 0,
    expiresAt: SESSION_DEFAULT_TTL_MS,
    revokedAt: null,
    ...overrides,
  };
}

describe('brand (cross-brand isolation)', () => {
  it('scopes the Sonthillu session cookie to the sonthillu brand', () => {
    expect(BRAND_AUTH_SCOPE).toBe('sonthillu');
    expect(SESSION_COOKIE_NAME).toBe('sonthillu_session');
    expect(brandSessionCookieName(BRAND_AUTH_SCOPE)).toBe('sonthillu_session');
  });

  it('produces a distinct cookie name for another brand', () => {
    expect(brandSessionCookieName('rrh')).toBe('rrh_session');
    expect(brandSessionCookieName('rrh')).not.toBe(SESSION_COOKIE_NAME);
  });

  it('recognises only the Sonthillu session cookie', () => {
    expect(isSonthilluSessionCookie('sonthillu_session')).toBe(true);
    expect(isSonthilluSessionCookie('rrh_session')).toBe(false);
    expect(isSonthilluSessionCookie('__Host-session')).toBe(false);
  });

  it('requires browser-invisible, secure session cookies', () => {
    expect(SESSION_COOKIE_ATTRIBUTES.httpOnly).toBe(true);
    expect(SESSION_COOKIE_ATTRIBUTES.secure).toBe(true);
    expect(SESSION_COOKIE_ATTRIBUTES.sameSite).toBe('lax');
  });
});

describe('schemas (method-agnostic identity input)', () => {
  it('accepts a valid identity with all fields', () => {
    const result = identityInputSchema.safeParse({
      displayName: '  Anil Kumar  ',
      email: ' Anil@Example.COM ',
      phone: '+919876543210',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe('Anil Kumar');
      expect(result.data.email).toBe('anil@example.com');
    }
  });

  it('accepts partial identity (guest may provide nothing yet)', () => {
    expect(identityInputSchema.safeParse({}).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(identityInputSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects an invalid phone number', () => {
    expect(identityInputSchema.safeParse({ phone: '123' }).success).toBe(false);
  });

  it('rejects an empty display name', () => {
    expect(identityInputSchema.safeParse({ displayName: '   ' }).success).toBe(false);
  });

  it('validates profile updates including communication preferences', () => {
    const ok = profileUpdateSchema.safeParse({
      displayName: 'Anil',
      preferredContactChannel: 'WHATSAPP',
      preferredContactTime: 'EVENING',
    });
    expect(ok.success).toBe(true);

    const bad = profileUpdateSchema.safeParse({
      preferredContactChannel: 'PIGEON',
    });
    expect(bad.success).toBe(false);
  });
});

describe('session-core (session lifecycle rules)', () => {
  it('computes expiry with the default TTL', () => {
    expect(computeSessionExpiry(1000)).toBe(1000 + SESSION_DEFAULT_TTL_MS);
  });

  it('clamps requested TTL to the configured maximum', () => {
    const now = 0;
    expect(computeSessionExpiry(now, SESSION_MAX_TTL_MS * 10)).toBe(SESSION_MAX_TTL_MS);
  });

  it('treats a session as active only while not expired and not revoked', () => {
    const active = makeSession({
      createdAt: 0,
      expiresAt: 1000,
      revokedAt: null,
    });
    expect(isSessionActive(active, 500)).toBe(true);
    expect(isSessionRevoked(active)).toBe(false);
  });

  it('considers a session expired at its expiry boundary', () => {
    const session = makeSession({ expiresAt: 1000 });
    expect(isSessionExpired(session, 1000)).toBe(true);
    expect(isSessionActive(session, 1000)).toBe(false);
    expect(isSessionActive(session, 999)).toBe(true);
  });

  it('considers a revoked session inactive regardless of expiry', () => {
    const session = makeSession({
      expiresAt: 1_000_000,
      revokedAt: 500,
    });
    expect(isSessionRevoked(session)).toBe(true);
    expect(isSessionActive(session, 600)).toBe(false);
  });

  it('enforces customer ownership (IDOR guard)', () => {
    expect(() => assertCustomerOwns(7, 7)).not.toThrow();
    expect(() => assertCustomerOwns(7, 8)).toThrow(UnauthorizedAccessError);
  });
});

describe('ratelimit (auth endpoint protection)', () => {
  it('allows requests up to the limit within the window', async () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });
    expect(await limiter.check('phone+9198', 0)).toEqual({
      allowed: true,
      remaining: 2,
      retryAfterMs: null,
    });
    expect((await limiter.check('phone+9198', 10)).allowed).toBe(true);
    expect((await limiter.check('phone+9198', 20)).allowed).toBe(true);
    expect((await limiter.check('phone+9198', 30)).allowed).toBe(false);
  });

  it('reports a retry-after when blocked', async () => {
    const limiter = createRateLimiter({ windowMs: 100, max: 1 });
    await limiter.check('k', 0);
    const blocked = await limiter.check('k', 50);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBe(50);
  });

  it('slides the window so old attempts stop counting', async () => {
    const limiter = createRateLimiter({ windowMs: 100, max: 2 });
    await limiter.check('k', 0);
    await limiter.check('k', 10);
    expect((await limiter.check('k', 150)).allowed).toBe(true);
  });

  it('resets a key on demand', async () => {
    const limiter = createRateLimiter({ windowMs: 100, max: 1 });
    await limiter.check('k', 0);
    expect((await limiter.check('k', 10)).allowed).toBe(false);
    await limiter.reset('k');
    expect((await limiter.check('k', 20)).allowed).toBe(true);
  });

  it('isolates keys by prefix so brands do not share buckets', async () => {
    const store = new MemoryRateLimitStore();
    const sonthillu = createRateLimiter({ windowMs: 100, max: 1, keyPrefix: 'sonthillu:' }, store);
    const rrh = createRateLimiter({ windowMs: 100, max: 1, keyPrefix: 'rrh:' }, store);
    await sonthillu.check('otp', 0);
    expect((await sonthillu.check('otp', 10)).allowed).toBe(false);
    expect((await rrh.check('otp', 10)).allowed).toBe(true);
  });
});

describe('privacy (safe logging)', () => {
  it('redacts sensitive credential and token fields', () => {
    const sanitized = sanitizeForLog({
      email: 'anil@example.com',
      password: 'hunter2',
      token: 'abc123',
      session_token: 'xyz',
      otp: '482913',
      secret: 's',
      api_key: 'k',
    });
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.token).toBe('[REDACTED]');
    expect(sanitized.session_token).toBe('[REDACTED]');
    expect(sanitized.otp).toBe('[REDACTED]');
    expect(sanitized.secret).toBe('[REDACTED]');
    expect(sanitized.api_key).toBe('[REDACTED]');
    expect(sanitized.email).toBe('anil@example.com');
  });

  it('matches sensitive keys case-insensitively', () => {
    expect(isSensitiveKey('Password')).toBe(true);
    expect(isSensitiveKey('ACCESS_TOKEN')).toBe(true);
    expect(isSensitiveKey('note')).toBe(false);
  });
});
