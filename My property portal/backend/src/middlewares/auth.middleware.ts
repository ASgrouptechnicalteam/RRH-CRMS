import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import prisma from '../utils/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

export const requirePolicyAcceptance = async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.type === 'Customer') {
    // Was accepting any prior acceptance record regardless of policy version
    // (a customer who accepted v1 stayed compliant forever, even after v2
    // shipped). Now requires acceptance of whichever policy is currently active.
    const activePolicy = await prisma.policy.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (activePolicy) {
      const policyAcceptance = await prisma.policyAcceptance.findFirst({
        where: { customerId: req.user.id, version: activePolicy.version },
      });

      if (!policyAcceptance) {
        return res.status(403).json({
          message: 'Forbidden: Policy not accepted',
          requiresPolicyAcceptance: true,
          currentPolicyVersion: activePolicy.version,
        });
      }
    }
  }
  next();
};
