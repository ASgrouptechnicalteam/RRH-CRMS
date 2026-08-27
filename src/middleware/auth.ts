import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
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

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
