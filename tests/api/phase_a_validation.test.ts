import request from 'supertest';
import app from '../../apps/api/src/server';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';

describe('PHASE A - Error Propagation and Zod Validation', () => {
  let telecallerToken: string;
  let mdToken: string;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Must run in test env');
    }
    await setupDeterministicTestUsers();

    const login = async (code: string) => {
      const res = await request(app).post('/api/v1/auth/login').send({ employee_code: code, password: 'Password@123' });
      return res.body.accessToken;
    };

    telecallerToken = await login(deterministicUsers.find(u => u.roles[0] === Roles.TELECALLER)!.employee_code);
    mdToken = await login(deterministicUsers.find(u => u.roles[0] === Roles.MD)!.employee_code);
  });

  describe('Zod Validation Rejection (400)', () => {
    it('should reject missing required fields with 400', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${telecallerToken}`)
        .send({
          // Missing customer_name and phone
          notes: 'Just testing missing fields'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Required');
      expect(res.body.details).toBeDefined();
    });

    it('should reject malformed email format with 400', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${telecallerToken}`)
        .send({
          customer_name: 'Test Lead',
          phone: '1234567890',
          email: 'not-an-email'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid email address');
    });
  });

  describe('ID Parsing Rejection (400)', () => {
    it('should reject non-numeric IDs before reaching Prisma', async () => {
      const res = await request(app)
        .get('/api/v1/opportunities/invalid-id')
        .set('Authorization', `Bearer ${telecallerToken}`);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid ID format');
    });
  });

  describe('Prisma Error Sanitization (400/409/404)', () => {
    it('should handle foreign key failures safely without leaking Prisma internals', async () => {
      // Trying to assign a lead to a non-existent user
      const res = await request(app)
        .post('/api/v1/leads/9999999/assign')
        .set('Authorization', `Bearer ${mdToken}`)
        .send({
          assigned_to_id: 9999999, // Fake ID
          reason: 'Testing FK failure'
        });
      
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
      
      const bodyString = JSON.stringify(res.body).toLowerCase();
      expect(bodyString).not.toContain('prisma');
      expect(bodyString).not.toContain('invocation');
      expect(bodyString).not.toContain('foreign key');
    });
  });

  describe('Production 500 Sanitization', () => {
    it('should not leak stack traces in standard error responses', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${telecallerToken}`)
        .send({}); // Missing fields
      
      const bodyString = JSON.stringify(res.body);
      expect(bodyString).not.toContain('stack');
      expect(bodyString).not.toContain('node_modules');
    });
  });
});
