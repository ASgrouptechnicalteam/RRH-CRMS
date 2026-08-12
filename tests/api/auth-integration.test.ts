import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Permissions, Roles } from '@rrh-ems/shared';
import { generateAccessToken } from '../../apps/api/src/utils/jwt';

// We import the specific routers we want to test
import employeeRoutes from '../../apps/api/src/routes/employees';

const app = express();
app.use(express.json());
app.use('/api/v1/employees', employeeRoutes);

// Helper to generate fake tokens
const generateToken = (payload: any) => {
  return generateAccessToken(payload);
};

// Since we are not doing full DB tests (this is just testing HTTP auth behavior),
// we will intercept the Prisma calls if necessary, or just verify the HTTP 403 Forbidden responses.
describe('Layer 2 & 3: API Integration & Regression Tests', () => {
  
  const cpmToken = generateToken({
    employeeId: 10,
    employeeCode: 'EMP-002',
    companyId: 1,
    branchId: 1,
    roles: [Roles.CHANNEL_PARTNER_MANAGER],
    permissions: [Permissions.EMPLOYEES_READ]
  });

  const telecallerToken = generateToken({
    employeeId: 11,
    employeeCode: 'EMP-003',
    companyId: 1,
    branchId: 1,
    roles: [Roles.TELECALLER],
    permissions: [] // Missing update permission
  });

  it('Permits Channel Partner Manager to fetch employees list (if they have permission)', async () => {
    // Assuming employees route requires EMPLOYEES_READ
    // For this test, it might fail if prisma is not mocked, but we expect at least it passes auth
    const res = await request(app)
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${cpmToken}`);
    
    // We expect it NOT to be 403 (could be 200 or 500 depending on mock)
    expect(res.status).not.toBe(403);
  });

  it('Denies Telecaller from updating employee (403 Forbidden)', async () => {
    const res = await request(app)
      .patch('/api/v1/employees/1')
      .set('Authorization', `Bearer ${telecallerToken}`)
      .send({ phone: '1234567890' });
    
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden/);
  });

});
