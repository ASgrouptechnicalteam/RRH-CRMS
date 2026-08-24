import request from 'supertest';
import app from '../../apps/api/src/server';
import { apiRateLimiter, loginRateLimiter } from '../../apps/api/src/middleware/rateLimiter';

const resetLimiterKey = (limiter: unknown, ip: string) => {
  (limiter as { resetKey?: (key: string) => void }).resetKey?.(ip);
};

describe('Phase B - API rate limiting', () => {
  const authIp = '198.51.100.41';
  const apiIp = '198.51.100.42';
  const strict = { 'x-strict-rate-limit': 'true' };

  beforeEach(() => {
    resetLimiterKey(loginRateLimiter, authIp);
    resetLimiterKey(apiRateLimiter, apiIp);
  });

  it('allows normal authentication attempts before the login limit', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', authIp)
        .set(strict)
        .send({ employee_code: 'RRH-ADMIN-001', password: 'wrong-password' });

      expect(res.status).toBe(401);
    }
  });

  it('returns a clean 429 after repeated authentication attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', authIp)
        .set(strict)
        .send({ employee_code: 'RRH-ADMIN-001', password: 'wrong-password' });
    }

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', authIp)
      .set(strict)
      .send({ employee_code: 'RRH-ADMIN-001', password: 'wrong-password' });

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      error: 'Too many login attempts from this IP, please try again after a minute',
      code: 'RATE_LIMIT_EXCEEDED',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/stack|prisma|at .*\(/i);
  });

  it('enforces the global API limit while allowing requests before its threshold', async () => {
    for (let i = 0; i < 300; i++) {
      const res = await request(app)
        .get('/api/v1/not-a-route')
        .set('X-Forwarded-For', apiIp)
        .set(strict);

      expect(res.status).toBe(404);
    }

    const limited = await request(app)
      .get('/api/v1/not-a-route')
      .set('X-Forwarded-For', apiIp)
      .set(strict);

    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      error: 'Too many API requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    });
    expect(JSON.stringify(limited.body)).not.toMatch(/stack|prisma|at .*\(/i);
  });
});
