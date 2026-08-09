import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Phase 0: Baseline Verification', () => {
  beforeAll(async () => {
    // Seed the deterministic users into the database
    await setupDeterministicTestUsers();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have 13 deterministic test roles created', async () => {
    const userCount = await prisma.employee.count({
      where: {
        employee_code: { in: deterministicUsers.map(u => u.employee_code) }
      }
    });
    
    // We expect exactly 13 deterministic authoritative role users
    expect(userCount).toBe(13);
  });
});
