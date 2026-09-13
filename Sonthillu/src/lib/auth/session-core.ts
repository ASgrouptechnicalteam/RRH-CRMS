import type { Session } from '@/types/auth';

export const SESSION_DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_MAX_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export function computeSessionExpiry(now: number, ttlMs: number = SESSION_DEFAULT_TTL_MS): number {
  const clamped = Math.min(Math.max(ttlMs, 0), SESSION_MAX_TTL_MS);
  return now + clamped;
}

export function isSessionRevoked(session: Pick<Session, 'revokedAt'>): boolean {
  return session.revokedAt != null;
}

export function isSessionExpired(session: Pick<Session, 'expiresAt'>, now: number): boolean {
  return now >= session.expiresAt;
}

export function isSessionActive(
  session: Pick<Session, 'expiresAt' | 'revokedAt'>,
  now: number
): boolean {
  return !isSessionRevoked(session) && !isSessionExpired(session, now);
}

export class UnauthorizedAccessError extends Error {
  constructor() {
    super('Unauthorized access to customer-owned resource');
    this.name = 'UnauthorizedAccessError';
  }
}

export function assertCustomerOwns(
  sessionCustomerId: number,
  resourceOwnerCustomerId: number
): void {
  if (sessionCustomerId !== resourceOwnerCustomerId) {
    throw new UnauthorizedAccessError();
  }
}
