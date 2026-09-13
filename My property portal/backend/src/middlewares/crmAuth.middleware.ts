import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Service-to-service authentication for inbound CRM -> Portal calls
 * (consolidation plan Decision 1). Mirrors apps/api's own
 * `authenticateServiceToken` pattern exactly — a constant-time bearer-secret
 * comparison, no JWT, no user identity. The CRM's PortalClient sends
 * `Authorization: Bearer {CRM_PORTAL_SECRET}`; this portal must be
 * configured with the SAME secret value to verify it.
 */

const timingSafeEqual = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

export const authenticateCrmServiceToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ status: 'error', code: 'UNAUTHORIZED', message: 'Service token required' });
  }

  const expected = process.env.CRM_PORTAL_SECRET;
  if (!expected) {
    return res
      .status(500)
      .json({ status: 'error', code: 'SERVER_ERROR', message: 'Service secret not configured' });
  }

  if (!timingSafeEqual(token, expected)) {
    return res
      .status(401)
      .json({ status: 'error', code: 'UNAUTHORIZED', message: 'Invalid service token' });
  }

  next();
};
