import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers } from '../fixtures/testUsers';

const p = prisma as any;

describe('Kiosk Credentials RBAC', () => {
  let adminToken: string;
  let hrToken: string;
  let empToken: string;
  let credId: number;

  beforeAll(async () => {
    await setupDeterministicTestUsers();
    
    const adminRes = await request(app).post('/api/v1/auth/login').send({ employee_code: 'RRH-TST-001', password: 'Password@123' });
    adminToken = adminRes.body.accessToken;
    
    // HR Manager
    const hrRes = await request(app).post('/api/v1/auth/login').send({ employee_code: 'RRH-TST-006', password: 'Password@123' });
    hrToken = hrRes.body.accessToken;

    // Plain Employee
    const empRes = await request(app).post('/api/v1/auth/login').send({ employee_code: 'RRH-TST-003', password: 'Password@123' });
    empToken = empRes.body.accessToken;

    // Create a credential to test PATCH
    const credRes = await request(app)
      .post('/api/v1/kiosk-credentials')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ branch_id: 1, label: 'Test', username: 'TEST_RBAC', password: 'Password@123' });
    credId = credRes.body.credential?.id;
  });

  it('GET /api/v1/kiosk-credentials should return 403 for HR and Employee', async () => {
    const hrRes = await request(app).get('/api/v1/kiosk-credentials').set('Authorization', `Bearer ${hrToken}`);
    expect(hrRes.status).toBe(403);
    
    const empRes = await request(app).get('/api/v1/kiosk-credentials').set('Authorization', `Bearer ${empToken}`);
    expect(empRes.status).toBe(403);
  });

  it('POST /api/v1/kiosk-credentials should return 403 for HR and Employee', async () => {
    const payload = { branch_id: 1, label: 'T', username: 'T2', password: 'P@1' };
    const hrRes = await request(app).post('/api/v1/kiosk-credentials').set('Authorization', `Bearer ${hrToken}`).send(payload);
    expect(hrRes.status).toBe(403);
    
    const empRes = await request(app).post('/api/v1/kiosk-credentials').set('Authorization', `Bearer ${empToken}`).send(payload);
    expect(empRes.status).toBe(403);
  });

  it('PATCH /api/v1/kiosk-credentials/:id should return 403 for HR and Employee', async () => {
    const payload = { label: 'T3' };
    const hrRes = await request(app).patch(`/api/v1/kiosk-credentials/${credId}`).set('Authorization', `Bearer ${hrToken}`).send(payload);
    expect(hrRes.status).toBe(403);
    
    const empRes = await request(app).patch(`/api/v1/kiosk-credentials/${credId}`).set('Authorization', `Bearer ${empToken}`).send(payload);
    expect(empRes.status).toBe(403);
  });
});
