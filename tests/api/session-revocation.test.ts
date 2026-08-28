import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import bcrypt from 'bcryptjs';



describe('SECURITY REGRESSION — JWT Session Revocation (Phase 2)', () => {
  let employee: any;
  let accessToken: string;
  let refreshToken: string;
  let familyToken: string;

  beforeAll(async () => {
    // 1. Create a dummy company, role, employee
    const company = await prisma.company.upsert({
      where: { code: 'REVTEST' },
      update: {},
      create: {
        name: 'Revocation Test Company',
        code: 'REVTEST',
      },
    });

    const role = await prisma.role.upsert({
      where: { name: 'TEST_EMPLOYEE_ROLE' },
      update: {},
      create: {
        name: 'TEST_EMPLOYEE_ROLE',
      },
    });

    const passHash = await bcrypt.hash('Password@123', 10);
    
    // Ensure we start fresh
    await prisma.employeeRole.deleteMany({ where: { employee: { employee_code: 'RRH-TS-001' } } });
    await prisma.employee.deleteMany({ where: { employee_code: 'RRH-TS-001' } });
    
    employee = await prisma.employee.create({
      data: {
        employee_code: 'RRH-TS-001',
        company_id: company.id,
        password_hash: passHash,
        status: 'ACTIVE',
        full_name: 'Revocation Test User',
        roles: {
          create: {
            role_id: role.id,
          },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.employeeRole.deleteMany({ where: { employee: { employee_code: 'RRH-TS-001' } } });
    await prisma.employee.deleteMany({ where: { employee_code: 'RRH-TS-001' } });
    await prisma.company.deleteMany({ where: { code: 'REVTEST' } });
    await prisma.$disconnect();
  });

  // TEST 1
  it('TEST 1: Active employee receives valid access', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ company_code: 'REVTEST', employee_code: 'RRH-TS-001', password: 'Password@123' });

    if(res.status !== 200) console.log(res.body); expect(res.status).toBe(200);
    accessToken = res.body.accessToken;
    
    // We expect cookie 'refreshToken'
    const cookie = res.headers['set-cookie']?.find((c: string) => c.startsWith('refreshToken='));
    expect(cookie).toBeDefined();
    if (cookie) {
        refreshToken = cookie.split(';')[0].split('=')[1];
    }

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.employeeCode).toBe('RRH-TS-001');
  });

  // TEST 2
  it('TEST 2: Suspend employee after issuing JWT -> reuse original JWT -> 401', async () => {
    // Suspend employee via route or directly. Wait, I'll do it via Prisma to isolate the test to middleware revocation
    await prisma.employee.update({
      where: { id: employee.id },
      data: { status: 'SUSPENDED', token_version: { increment: 1 } },
    });

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    
    // 401 because token version mismatches AND user is suspended
    expect(meRes.status).toBe(401);
    expect(meRes.body.error).toMatch(/User is inactive or suspended|Token version stale/);
  });

  // TEST 3
  it('TEST 3: Inactive employee old JWT -> 401', async () => {
    await prisma.employee.update({
      where: { id: employee.id },
      data: { status: 'INACTIVE', token_version: { increment: 1 } },
    });

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(meRes.status).toBe(401);
  });

  // Restore employee for next tests
  it('Restore employee to ACTIVE', async () => {
    await prisma.employee.update({
      where: { id: employee.id },
      data: { status: 'ACTIVE', token_version: { increment: 1 } },
    });
    
    // Re-login to get fresh token
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ company_code: 'REVTEST', employee_code: 'RRH-TS-001', password: 'Password@123' });
    
    if(res.status !== 200) console.log(res.body); expect(res.status).toBe(200);
    accessToken = res.body.accessToken;
  });

  // TEST 4
  it('TEST 4: Role change -> Reuse original JWT -> 401', async () => {
    // Simulate role change which increments token_version
    await prisma.employee.update({
      where: { id: employee.id },
      data: { token_version: { increment: 1 } },
    });

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(meRes.status).toBe(401);
    expect(meRes.body.error).toBe('Token version stale');
  });

  // Prepare for refresh tests
  it('Prepare for refresh tests', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ company_code: 'REVTEST', employee_code: 'RRH-TS-001', password: 'Password@123' });
    
    if(res.status !== 200) console.log(res.body); expect(res.status).toBe(200);
    accessToken = res.body.accessToken;
    const cookie = res.headers['set-cookie']?.find((c: string) => c.startsWith('refreshToken='));
    if (cookie) refreshToken = cookie.split(';')[0].split('=')[1];
  });

  // TEST 5
  it('TEST 5: Refresh after suspension -> 401', async () => {
    // Suspend and simulate the revocation that the employee update route does
    await prisma.$transaction(async (tx) => {
        await tx.employee.update({
            where: { id: employee.id },
            data: { status: 'SUSPENDED', token_version: { increment: 1 } }
        });
        await tx.authSession.updateMany({
            where: { employee_id: employee.id, revoked: false },
            data: { revoked: true, revocation_reason: 'AUTHORIZATION_CHANGED' }
        });
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`]);
    
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Session revoked');
  });

  // TEST 6
  it('TEST 6: Refresh after role change -> 401', async () => {
    await prisma.employee.update({
      where: { id: employee.id },
      data: { status: 'ACTIVE' }
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: 'RRH-TS-001', password: 'Password@123' });
    
    let currentRefresh = '';
    const cookie = loginRes.headers['set-cookie']?.find((c: string) => c.startsWith('refreshToken='));
    if (cookie) currentRefresh = cookie.split(';')[0].split('=')[1];

    // Simulate role change revocation
    await prisma.$transaction(async (tx) => {
        await tx.employee.update({
            where: { id: employee.id },
            data: { token_version: { increment: 1 } }
        });
        await tx.authSession.updateMany({
            where: { employee_id: employee.id, revoked: false },
            data: { revoked: true, revocation_reason: 'AUTHORIZATION_CHANGED' }
        });
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [`refreshToken=${currentRefresh}`]);
    
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Session revoked');
  });

  // TEST 7
  it('TEST 7: Token version mismatch -> 401', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ company_code: 'REVTEST', employee_code: 'RRH-TS-001', password: 'Password@123' });
    
    const token = loginRes.body.accessToken;

    // Increment token_version in db behind the scenes
    await prisma.employee.update({
      where: { id: employee.id },
      data: { token_version: { increment: 1 } },
    });

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    
    expect(meRes.status).toBe(401);
    expect(meRes.body.error).toBe('Token version stale');
  });

  // TEST 8
  it('TEST 8: Current token version -> authenticated', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ company_code: 'REVTEST', employee_code: 'RRH-TS-001', password: 'Password@123' });
    
    const token = loginRes.body.accessToken;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    
    expect(meRes.status).toBe(200);
  });
  
  // TEST 9
  it('TEST 9: Missing tokenVersion -> 401', async () => {
    // We generate a legacy token manually using jwt.sign without tokenVersion
    const jwt = require('jsonwebtoken');
    const legacyToken = jwt.sign({
      employeeId: employee.id,
      employeeCode: 'RRH-TS-001',
      companyId: employee.company_id,
      branchId: null,
      roles: ['TEST_EMPLOYEE_ROLE'],
      permissions: []
    }, process.env.JWT_ACCESS_SECRET, { expiresIn: '24h' });

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${legacyToken}`);
    
    expect(meRes.status).toBe(401);
    expect(meRes.body.error).toBe('Token version missing (legacy token)');
  });
  
  // TEST 10
  it('TEST 10: Password change invalidates previous JWT', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ employee_code: 'RRH-TS-001', password: 'Password@123' });
    
    const token = loginRes.body.accessToken;

    // Change password via the actual API endpoint
    const pwRes = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: 'Password@123', new_password: 'NewPassword@123' });
      
    expect(pwRes.status).toBe(200);
    
    // Previous token should now be invalid because token_version was incremented
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
      
    expect(meRes.status).toBe(401);
  });
});
