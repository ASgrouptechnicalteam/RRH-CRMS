import { prisma } from '../../apps/api/src/lib/prisma';
import { ProjectUnitService } from '../../apps/api/src/services/projectUnit.service';
import { Roles, ALL_PERMISSIONS } from '@rrh-ems/shared';
import { TokenPayload } from '../../apps/api/src/utils/jwt';

// Rebuild Phase 4: InventoryFeature CRUD and the AuditEvent activity feed for
// the Unit Detail page (implementation plan section 7.4).
describe('ProjectUnit features and activity log', () => {
  const companyId = 1;
  const admin: TokenPayload = {
    employeeId: 999970,
    employeeCode: 'ADMIN-FT-1',
    companyId,
    branchId: null,
    roles: [Roles.ADMIN, Roles.MD],
    permissions: ALL_PERMISSIONS,
  };
  const projectId = 8880470;
  let unitId: number;

  beforeAll(async () => {
    await prisma.employee.create({
      data: {
        id: admin.employeeId,
        employee_code: admin.employeeCode,
        company_id: companyId,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Feature Test Admin',
      },
    });
    await prisma.project.create({
      data: {
        id: projectId,
        project_code: `TEST-FT-${Date.now()}`,
        company_id: companyId,
        name: 'Feature/Activity Test Project',
        location: 'Test Location',
        slug: `test-ft-${Date.now()}`,
      },
    });
    const unit = await ProjectUnitService.createUnit(admin, projectId, {
      unit_number: 'F-001',
      unit_type: 'PLOT',
      plot_area_sqyd: 100,
      price_basis: 'PLOT_AREA',
      base_rate: 10000,
    } as any);
    unitId = unit.id;
  });

  afterAll(async () => {
    await prisma.inventoryFeature.deleteMany({ where: { project_unit_id: unitId } });
    await prisma.priceLine.deleteMany({ where: { project_unit: { project_id: projectId } } });
    await prisma.auditEvent.deleteMany({
      where: { entity_type: 'PROJECT_UNIT', entity_id: unitId },
    });
    await prisma.projectUnit.deleteMany({ where: { project_id: projectId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.employee.delete({ where: { id: admin.employeeId } });
  });

  it('1. Adds a feature to a unit', async () => {
    const feature = await ProjectUnitService.addFeature(admin, unitId, 'Park Facing', 25000);
    expect(feature.label).toBe('Park Facing');
    expect(feature.charge_amount).toBe(25000);

    const unit = await ProjectUnitService.getUnit(admin, unitId);
    expect(unit.features.length).toBe(1);
  });

  it('2. Removes a feature', async () => {
    const feature = await ProjectUnitService.addFeature(admin, unitId, 'Temporary', null);
    await ProjectUnitService.removeFeature(admin, unitId, feature.id);
    const unit = await ProjectUnitService.getUnit(admin, unitId);
    expect(unit.features.some((f) => f.id === feature.id)).toBe(false);
  });

  it('3. Removing a feature that belongs to a different unit is rejected', async () => {
    const other = await ProjectUnitService.createUnit(admin, projectId, {
      unit_number: 'F-002',
      unit_type: 'PLOT',
      plot_area_sqyd: 80,
      price_basis: 'PLOT_AREA',
    } as any);
    const feature = await ProjectUnitService.addFeature(admin, other.id, 'Elsewhere', null);
    await expect(ProjectUnitService.removeFeature(admin, unitId, feature.id)).rejects.toMatchObject(
      { status: 404 },
    );
    await prisma.inventoryFeature.delete({ where: { id: feature.id } });
    await prisma.projectUnit.delete({ where: { id: other.id } });
  });

  it('4. STATUS_CHANGE and PRICE_OVERRIDE events appear in the activity log, newest first', async () => {
    await ProjectUnitService.changeStatus(admin, unitId, 'HOLD', 'Walk-in customer');
    await ProjectUnitService.overridePrice(admin, unitId, 999999, 'Negotiated discount');

    const events = await ProjectUnitService.listActivity(admin, unitId);
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0].action).toBe('PRICE_OVERRIDE');
    expect(events[0].actor_name).toBe('Feature Test Admin');
    expect(
      events.some((e) => e.action === 'STATUS_CHANGE' && e.reason === 'Walk-in customer'),
    ).toBe(true);

    await ProjectUnitService.overridePrice(admin, unitId, null, null);
    await ProjectUnitService.changeStatus(admin, unitId, 'AVAILABLE');
  });

  it('5. Activity is scoped to the unit — a different unit sees none of it', async () => {
    const other = await ProjectUnitService.createUnit(admin, projectId, {
      unit_number: 'F-003',
      unit_type: 'PLOT',
      plot_area_sqyd: 80,
      price_basis: 'PLOT_AREA',
    } as any);
    const events = await ProjectUnitService.listActivity(admin, other.id);
    expect(events.length).toBe(0);
    await prisma.projectUnit.delete({ where: { id: other.id } });
  });
});
