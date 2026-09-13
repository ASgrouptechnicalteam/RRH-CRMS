import request from 'supertest';
import app from '../src/server';
import prisma from '../src/utils/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('../src/utils/prisma', () => ({
  customer: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  employee: {
    findUnique: jest.fn(),
  },
  failedLoginAttempt: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  loginHistory: {
    create: jest.fn(),
  },
}));

describe('Authentication & RBAC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should reject login without identifier or password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.status).toBe(400);
    });

    it('should login a customer and return an HttpOnly cookie', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        phone: '1234567890',
        name: 'Test Customer',
        passwordHash,
        status: 'Active',
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: '1234567890',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toMatch(/token=.*; HttpOnly/);
    });

    it('should block login if account is locked due to failed attempts', async () => {
      (prisma.failedLoginAttempt.findUnique as jest.Mock).mockResolvedValue({
        identifier: '1234567890',
        count: 5,
        lockedUntil: new Date(Date.now() + 100000),
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: '1234567890',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('locked');
    });
  });

  describe('RBAC Middleware', () => {
    // We add a dummy route to test the RBAC middleware
    app.get(
      '/api/v1/test/md-only',
      (req, res, next) => {
        // mock authenticate
        req.cookies = {
          token: jwt.sign({ id: '1', role: 'Customer', type: 'Customer' }, 'super-secret-key'),
        };
        next();
      },
      require('../src/middlewares/auth.middleware').authenticate,
      require('../src/middlewares/auth.middleware').authorizeRoles('MD'),
      (req, res) => res.status(200).json({ ok: true }),
    );

    it('should return 403 when a Customer tries to access an MD route', async () => {
      const res = await request(app).get('/api/v1/test/md-only');
      expect(res.status).toBe(403);
    });
  });
});
