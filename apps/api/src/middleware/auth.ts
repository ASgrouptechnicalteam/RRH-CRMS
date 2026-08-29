import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface KioskAuthenticatedRequest extends Request {
  kiosk?: {
    companyId: number;
    branchId: number;
    kioskCredentialId: number;
    credentialVersion: number;
    label: string;
    branchName: string;
  };
}

export interface ServiceRequest extends Request {
  service?: { service: string };
}

const timingSafeEqual = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

/**
 * Kiosk auth rate-limit / lockout state.
 * Tracks consecutive failed KIOSK auth attempts per branch_id.
 * Sliding window: 5 failures within 15 minutes → 403 LOCKED_OUT until the
 * oldest failure falls outside the window, at which point the counter resets.
 *
 * Chosen defaults (documented here for the audit trail):
 *   - MAX_FAILURES_PER_WINDOW  = 5
 *   - LOCKOUT_WINDOW_MS        = 15 * 60 * 1000  (15 minutes)
 *
 * The counter is keyed on branch_id (not credential_id) because the kiosk
 * terminal's physical location is the attack surface an admin cares about —
 * a guessed password on "Main Branch" shouldn't let an attacker burn through
 * every credential at that branch in quick succession.
 *
 * IMPORTANT: this rate limit does NOT apply to employee (EMPLOYEE) auth
 * anywhere else in the app — it is scoped entirely to KIOSK auth attempts.
 */
const KIOSK_RATE_LIMIT = {
  maxFailures: 5,
  windowMs: 15 * 60 * 1000,
};

// In-memory store: branchId → { failures: number[], resetAt?: number }
// Not persisted across server restarts — acceptable for a kiosk-terminal
// lockout where a restart would also kill any active kiosk session anyway.
const kioskFailuresByBranch = new Map<number, { failures: number[] }>();

const pruneOldFailures = (failures: number[], now: number, windowMs: number): number[] => {
  return failures.filter((t) => now - t < windowMs);
};

export const recordKioskAuthFailure = (branchId: number): boolean => {
  const now = Date.now();
  let state = kioskFailuresByBranch.get(branchId);
  if (!state) {
    state = { failures: [] };
    kioskFailuresByBranch.set(branchId, state);
  }
  state.failures.push(now);
  state.failures = pruneOldFailures(state.failures, now, KIOSK_RATE_LIMIT.windowMs);
  return state.failures.length >= KIOSK_RATE_LIMIT.maxFailures;
};

export const isKioskAuthLockedOut = (branchId: number): boolean => {
  const now = Date.now();
  const state = kioskFailuresByBranch.get(branchId);
  if (!state) return false;
  state.failures = pruneOldFailures(state.failures, now, KIOSK_RATE_LIMIT.windowMs);
  return state.failures.length >= KIOSK_RATE_LIMIT.maxFailures;
};

export const resetKioskAuthState = (branchId: number): void => {
  kioskFailuresByBranch.delete(branchId);
};

/**
 * Service-to-service authentication for Portal callbacks.
 * Validates a Service Bearer Secret against PORTAL_CRM_SECRET (constant-time comparison).
 * Does NOT require a user JWT — service tokens do not carry user identity.
 */
export const authenticateServiceToken = (req: ServiceRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Service token required',
      code: 'UNAUTHORIZED',
    });
  }

  const expected = process.env.PORTAL_CRM_SECRET;
  if (!expected) {
    return res.status(500).json({
      error: 'Service secret not configured',
      code: 'SERVER_ERROR',
    });
  }

  if (!timingSafeEqual(token, expected)) {
    return res.status(401).json({
      error: 'Invalid service token',
      code: 'UNAUTHORIZED',
    });
  }

  req.service = { service: 'portal' };
  next();
};

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'UNAUTHORIZED',
    });
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.tokenVersion === undefined) {
      return res.status(401).json({
        error: 'Token version missing (legacy token)',
        code: 'TOKEN_EXPIRED',
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: payload.employeeId },
      select: { status: true, token_version: true },
    });

    if (!employee) {
      return res.status(401).json({ error: 'User not found', code: 'UNAUTHORIZED' });
    }

    if (employee.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User is inactive or suspended', code: 'UNAUTHORIZED' });
    }

    if (payload.tokenVersion !== employee.token_version) {
      return res.status(401).json({ error: 'Token version stale', code: 'TOKEN_EXPIRED' });
    }

    req.user = payload;
    next();
  } catch (err: any) {
    console.error('JWT VERIFICATION ERROR:', err);
    // If token expired, return clear code so frontend automatically throws user to login page
    return res.status(401).json({
      error: 'Token expired or invalid',
      code: 'TOKEN_EXPIRED',
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated', code: 'UNAUTHORIZED' });
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges', code: 'FORBIDDEN' });
    }

    next();
  };
};

export const requirePermission = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated', code: 'UNAUTHORIZED' });
    }

    if (!req.user.permissions || !Array.isArray(req.user.permissions)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }

    const userPermissions = req.user.permissions;
    const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }

    next();
  };
};

/**
 * authenticateKioskToken — accepts ONLY type:'KIOSK' tokens.
 * Verifies credential_version matches the current DB value so rotations
 * kill active sessions immediately.
 * Attaches kiosk info to req.kiosk.
 */
export const authenticateKioskToken = async (req: KioskAuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Kiosk token required',
      code: 'UNAUTHORIZED',
    });
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.type !== 'KIOSK') {
      return res.status(401).json({
        error: 'Token is not a kiosk token',
        code: 'UNAUTHORIZED',
      });
    }

    if (payload.kioskCredentialId === undefined) {
      return res.status(401).json({
        error: 'Kiosk token missing credential ID',
        code: 'UNAUTHORIZED',
      });
    }

    // ── Rate-limit / lockout check (per branch_id) ─────────────────────────
    // Only applied when we can identify the branch from the token payload.
    // Failed attempts (wrong password, expired token, stale version) all count.
    const branchId = payload.branchId;
    if (branchId != null && isKioskAuthLockedOut(branchId)) {
      return res.status(403).json({
        error: 'Too many failed kiosk auth attempts for this branch. Try again later.',
        code: 'LOCKED_OUT',
      });
    }

    const kioskCred = await prisma.kioskCredential.findUnique({
      where: { id: payload.kioskCredentialId },
      include: { branch: true },
    });

    if (!kioskCred) {
      // Unknown credential — record the failure against the branch_id embedded
      // in the token (if present) so the attacker can't switch to a different
      // credential at the same branch to evade the lockout.
      if (branchId != null) {
        recordKioskAuthFailure(branchId);
      }
      return res.status(401).json({ error: 'Kiosk credential not found', code: 'UNAUTHORIZED' });
    }

    if (!kioskCred.is_active) {
      if (branchId != null) {
        recordKioskAuthFailure(branchId);
      }
      return res.status(401).json({ error: 'Kiosk credential is deactivated', code: 'UNAUTHORIZED' });
    }

    if (payload.credentialVersion !== kioskCred.credential_version) {
      if (branchId != null) {
        recordKioskAuthFailure(branchId);
      }
      return res.status(401).json({ error: 'Kiosk token version stale — please log in again', code: 'TOKEN_EXPIRED' });
    }

    // Success — reset the failure counter for this branch.
    if (branchId != null) {
      resetKioskAuthState(branchId);
    }

    req.kiosk = {
      companyId: kioskCred.company_id,
      branchId: kioskCred.branch_id,
      kioskCredentialId: kioskCred.id,
      credentialVersion: kioskCred.credential_version,
      label: kioskCred.label,
      branchName: kioskCred.branch.name,
    };
    next();
  } catch (err: any) {
    console.error('KIOSK JWT VERIFICATION ERROR:', err);
    return res.status(401).json({
      error: 'Kiosk token expired or invalid',
      code: 'TOKEN_EXPIRED',
    });
  }
};
