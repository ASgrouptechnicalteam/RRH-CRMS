import { prisma } from '../../apps/api/src/lib/prisma';
import { PropertyService } from '../../apps/api/src/services/property.service';
import { Roles } from '@rrh-ems/shared';
import { TokenPayload } from '../../apps/api/src/utils/jwt';

// Phase 2.17 (2026-09-06): the Properties page must show standalone inventory
// only — project units are reached exclusively through that project's own
// Units view. Verifies PropertyService.listProperties defaults to
// project_id: null when no project_id filter is explicitly requested, while
// an explicit project_id filter (used by the project's Units tab) is unaffected.
describe('Phase 2.17 - Properties list defaults to standalone-only', () => {
  const companyId = 1;
  const mockAdmin: TokenPayload = {
    employeeId: 999901,
    employeeCode: 'ADMIN-2-17',
    companyId,
    branchId: null,
    roles: [Roles.ADMIN],
  };

  const standaloneId = 8880001;
  const linkedId = 8880002;
  const projectId = 8880099;

  beforeAll(async () => {
    await prisma.project.create({
      data: {
        id: projectId,
        project_code: `TEST-2-17-${Date.now()}`,
        company_id: companyId,
        name: 'Phase 2.17 Test Project',
        location: 'Test Location',
        slug: `test-2-17-${Date.now()}`,
      },
    });

    await prisma.property.createMany({
      data: [
        {
          id: standaloneId,
          property_code: `STANDALONE-2-17-${Date.now()}`,
          company_id: companyId,
          title: 'Standalone Test Property',
          brand_type: 'SONTHILLU',
          category: 'VILLA',
          final_price: 1000000,
          area_sqft: 1000,
          location: 'Test Location',
          project_id: null,
        },
        {
          id: linkedId,
          property_code: `LINKED-2-17-${Date.now()}`,
          company_id: companyId,
          title: 'Project-Linked Test Unit',
          brand_type: 'SONTHILLU',
          category: 'PLOT',
          final_price: 500000,
          area_sqft: 800,
          location: 'Test Location',
          project_id: projectId,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.property.deleteMany({ where: { id: { in: [standaloneId, linkedId] } } });
    await prisma.project.delete({ where: { id: projectId } });
  });

  it('1. GET /properties with no project_id filter returns only standalone properties', async () => {
    const results = await PropertyService.listProperties(mockAdmin, {}, 100, 0);
    const ids = results.map((r: any) => r.id);
    expect(ids).toContain(standaloneId);
    expect(ids).not.toContain(linkedId);
  });

  it("2. An explicit project_id filter still returns that project's units (unaffected by the default change)", async () => {
    const results = await PropertyService.listProperties(
      mockAdmin,
      { project_id: projectId },
      100,
      0,
    );
    const ids = results.map((r: any) => r.id);
    expect(ids).toContain(linkedId);
    expect(ids).not.toContain(standaloneId);
  });
});
