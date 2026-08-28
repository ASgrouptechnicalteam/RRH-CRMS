import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';



const login = async (employeeCode: string): Promise<string> => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ employee_code: employeeCode, password: 'Password@123' });
  return res.body.accessToken;
};

describe('Phase D - API Resilience & Pagination', () => {
  let mdToken: string;

  beforeAll(async () => {
    await setupDeterministicTestUsers();
    const mdUser = deterministicUsers.find(u => u.roles[0] === Roles.MD);
    if (!mdUser) throw new Error('MD user not found in fixtures');
    mdToken = await login(mdUser.employee_code);
  });

  it('1. Leads endpoint should respect limit and offset', async () => {
    const res1 = await request(app)
      .get('/api/v1/leads?limit=1&offset=0')
      .set('Authorization', `Bearer ${mdToken}`);
      
    expect(res1.status).toBe(200);
    expect(res1.body.pagination).toBeDefined();
    expect(res1.body.pagination.limit).toBe(1);
    expect(res1.body.leads.length).toBeLessThanOrEqual(1);

    const res2 = await request(app)
      .get('/api/v1/leads?limit=150&offset=0') // Should cap at 100
      .set('Authorization', `Bearer ${mdToken}`);
      
    expect(res2.status).toBe(200);
    expect(res2.body.pagination.limit).toBe(100);
  });

  it('2. Customers endpoint should respect limit and offset', async () => {
    const res1 = await request(app)
      .get('/api/v1/customers?limit=2&offset=0')
      .set('Authorization', `Bearer ${mdToken}`);
      
    expect(res1.status).toBe(200);
    expect(res1.body.pagination).toBeDefined();
    expect(res1.body.pagination.limit).toBe(2);
    expect(res1.body.customers.length).toBeLessThanOrEqual(2);
  });
});
