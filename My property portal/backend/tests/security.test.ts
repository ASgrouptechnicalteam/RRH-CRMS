import request from 'supertest';
import app from '../src/server';
import prisma from '../src/utils/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

jest.mock('../src/utils/prisma', () => ({
  failedLoginAttempt: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  customer: {
    findUnique: jest.fn(),
  },
  employee: {
    findUnique: jest.fn(),
  },
  loginHistory: {
    create: jest.fn(),
  },
  policyAcceptance: {
    findFirst: jest.fn(),
  },
}));

jest.mock('../src/utils/jwt');

describe('Security Hardening', () => {
  const getCookie = (role: string, id: string = 'user-1') => {
    const token = jwt.sign(
      { id, role, type: role === 'Customer' ? 'Customer' : 'Employee' },
      process.env.JWT_SECRET || 'secret',
    );
    return `token=${token}`;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const jwtMock = require('../src/utils/jwt');
    jwtMock.verifyToken = jest.fn((token: string) => jwt.decode(token));
    (prisma.policyAcceptance.findFirst as jest.Mock).mockResolvedValue({ id: 'acc-1' });
  });

  describe('1. Brute Force Protection (Lockout)', () => {
    it('should reject login if account is locked out', async () => {
      // Mock that the account has a lockedUntil in the future
      (prisma.failedLoginAttempt.findUnique as jest.Mock).mockResolvedValue({
        identifier: 'locked_user',
        count: 5,
        lockedUntil: new Date(Date.now() + 10 * 60000), // Locked for 10 more minutes
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: 'locked_user', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/temporarily locked/i);
    });

    it('should trigger lockout after max attempts', async () => {
      // Mock no lock initially and 4 attempts
      (prisma.failedLoginAttempt.findUnique as jest.Mock).mockResolvedValue({
        identifier: 'fail_user',
        count: 4, // Next fail will be 5th
      });
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: 'fail_user', password: 'wrong' });

      expect(res.status).toBe(401);

      // Verify update was called with lockedUntil
      expect(prisma.failedLoginAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            count: 5,
            lockedUntil: expect.any(Date), // Should set lockout
          }),
        }),
      );
    });
  });

  describe('2. Rate Limiting', () => {
    it('should apply strict rate limits to auth routes', async () => {
      // Send 11 requests to trigger rate limit (max is 10)
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ identifier: 'rate_limit_test', password: 'pwd' });
      }

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: 'rate_limit_test', password: 'pwd' });

      expect(res.status).toBe(429); // Too Many Requests
    });
  });

  describe('3. Role Validation & Isolation', () => {
    it('should prevent Customer from accessing MD endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/md/dashboard') // Ensure this is actually a route or any protected route
        .set('Cookie', getCookie('Customer', 'cust-1'));

      // In real scenario, authenticate middleware strips non-MD access
      expect(res.status).toBe(403);
    });

    it('should prevent PM from accessing FM endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/fm/dashboard')
        .set('Cookie', getCookie('PM', 'pm-1'));

      expect(res.status).toBe(403);
    });
  });
});
