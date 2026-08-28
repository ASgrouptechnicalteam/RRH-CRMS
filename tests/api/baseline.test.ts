import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { prisma } from '../../apps/api/src/lib/prisma';



describe('Phase 0: Baseline Verification', () => {
  beforeAll(async () => {
    // Seed the deterministic users into the database
    await setupDeterministicTestUsers();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have 11 deterministic test roles created', async () => {
    const userCount = await prisma.employee.count({
      where: {
        employee_code: { in: deterministicUsers.map(u => u.employee_code) }
      }
    });
    
    // We expect exactly 12 deterministic authoritative role users
    expect(userCount).toBe(12);
  });
});
