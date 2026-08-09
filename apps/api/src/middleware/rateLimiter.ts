import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const p = prisma as any;

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 login requests per window
  message: { error: 'Too many login attempts from this IP, please try again after a minute', code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true, 
  legacyHeaders: false, 
  handler: async (req, res, next, options) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'UNKNOWN_IP';
    const emailOrCode = req.body?.employee_code || 'UNKNOWN_CODE';
    
    try {
      await p.auditEvent.create({
        data: {
          actor_id: 0,
          action: 'SECURITY_ALERT',
          entity_type: 'RATE_LIMIT_EXCEEDED',
          entity_id: 0,
          new_value: `Login rate limit exceeded for IP: ${ip}, targeting: ${emailOrCode}`
        }
      });
    } catch (err) {
      console.error('Failed to log rate limit audit event', err);
    }
    
    res.status(options.statusCode).json(options.message);
  }
});
