import { prisma } from '../../apps/api/src/lib/prisma';
import { ProjectUnitService } from '../../apps/api/src/services/projectUnit.service';
import { PricingRulesService } from '../../apps/api/src/services/pricing/rules.service';
import { AmenityService } from '../../apps/api/src/services/amenity.service';
import { PricingService } from '../../apps/api/src/services/pricing/pricing.service';
import { Roles, Permissions, ALL_PERMISSIONS } from '@rrh-ems/shared';
import { TokenPayload } from '../../apps/api/src/utils/jwt';

// Rebuild Phase 3: Amenity/ProjectAmenity CRUD and its wiring into the
// pricing engine (implementation plan section 6.2/6.3). A CHARGEABLE amenity
// must behave exactly like a ProjectPricingRule; a SELECTED_UNITS one must
// apply only to units that explicitly opted in, and that selection must
// survive a project-wide recalculation.
describe('Amenity catalog, project configuration, and pricing engine wiring', () => {
  const companyId = 1;
  const admin: TokenPayload = {
    employeeId: 999960,
    employeeCode: 'ADMIN-AM-1',
    companyId,
    branchId: null,
    roles: [Roles.ADMIN, Roles.MD],
    permissions: ALL_PERMISSIONS,
  };
  const projectId = 8880360;
  let amenityId: number;
  let unitAId: number;
  let unitBId: number;

  beforeAll(async () => {
    await prisma.employee.create({
      data: {
        id: admin.employeeId,
        employee_code: admin.employeeCode,
        company_id: companyId,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Amenity Test Admin',
      },
    });
    await prisma.project.create({
      data: {
        id: projectId,
        project_code: `TEST-AM-${Date.now()}`,
        company_id: companyId,
        name: 'Amenity Wiring Test Project',
        location: 'Test Location',
        slug: `test-am-${Date.now()}`,
      },
    });
    await PricingRulesService.createRule(admin, projectId, {
      label: 'Base Rate',
      kind: 'BASE_RATE',
      category: 'OTHER',
      calc_method: 'PER_SQYD',
      rate: 20000,
      area_basis: 'PLOT_AREA',
    });

    const unitA = await ProjectUnitService.createUnit(admin, projectId, {
      unit_number: 'A-001',
      unit_type: 'PLOT',
      plot_area_sqyd: 100,
      price_basis: 'PLOT_AREA',
    } as any);
    const unitB = await ProjectUnitService.createUnit(admin, projectId, {
      unit_number: 'A-002',
      unit_type: 'PLOT',
      plot_area_sqyd: 100,
      price_basis: 'PLOT_AREA',
    } as any);
    unitAId = unitA.id;
    unitBId = unitB.id;
  });

  afterAll(async () => {
    await prisma.priceLine.deleteMany({ where: { project_unit: { project_id: projectId } } });
    await prisma.projectAmenity.deleteMany({ where: { project_id: projectId } });
    await prisma.projectUnit.deleteMany({ where: { project_id: projectId } });
    await prisma.projectPricingRule.deleteMany({ where: { project_id: projectId } });
    await prisma.project.delete({ where: { id: projectId } });
    if (amenityId) await prisma.amenity.delete({ where: { id: amenityId } }).catch(() => {});
    await prisma.employee.delete({ where: { id: admin.employeeId } });
  });

  it('1. Both units start at base price only (2,000,000)', async () => {
    const a = await ProjectUnitService.getUnit(admin, unitAId);
    const b = await ProjectUnitService.getUnit(admin, unitBId);
    expect(a.final_price).toBe(2000000);
    expect(b.final_price).toBe(2000000);
  });

  it('2. Creates a catalog amenity', async () => {
    const amenity = await AmenityService.createCatalogAmenity(admin, {
      name: 'Clubhouse Access',
      category: 'RECREATION',
    });
    amenityId = amenity.id;
    expect(amenity.company_id).toBe(companyId);
    expect(amenity.is_active).toBe(true);
  });

  it('3. Lists the catalog', async () => {
    const catalog = await AmenityService.listCatalog(admin);
    expect(catalog.some((a) => a.id === amenityId)).toBe(true);
  });

  it('4. Setting the amenity CHARGEABLE + ALL_UNITS, then recalculating, applies the charge to every existing unit', async () => {
    // Same as a pricing-rule edit (PricingRulesService never auto-recalculates
    // either): configuring the amenity alone must not silently move an
    // existing unit's price — only the explicit "Recalculate All Units" does.
    await AmenityService.setProjectAmenity(admin, projectId, amenityId, {
      availability: 'CHARGEABLE',
      charge_calc_method: 'FIXED',
      charge_amount: 50000,
      applicability: 'ALL_UNITS',
    } as any);
    const untouched = await ProjectUnitService.getUnit(admin, unitAId);
    expect(untouched.final_price).toBe(2000000);

    await PricingService.applyRecalculateProject(admin, projectId);

    const a = await ProjectUnitService.getUnit(admin, unitAId);
    const b = await ProjectUnitService.getUnit(admin, unitBId);
    expect(a.final_price).toBe(2050000);
    expect(b.final_price).toBe(2050000);
    expect(
      a.price_lines.some((l) => l.label === 'Clubhouse Access' && l.category === 'AMENITY'),
    ).toBe(true);
    // Amenity-sourced lines have no real ProjectPricingRule row behind them.
    expect(a.price_lines.find((l) => l.label === 'Clubhouse Access')!.rule_id).toBeNull();
  });

  it('5. A newly-created unit picks up the chargeable amenity automatically', async () => {
    const unitC = await ProjectUnitService.createUnit(admin, projectId, {
      unit_number: 'A-003',
      unit_type: 'PLOT',
      plot_area_sqyd: 100,
      price_basis: 'PLOT_AREA',
    } as any);
    expect(unitC.final_price).toBe(2050000);
    await prisma.projectUnit.delete({ where: { id: unitC.id } });
  });

  it('6. Switching to SELECTED_UNITS (only unit A) and recalculating removes the charge from B, keeps it on A', async () => {
    await AmenityService.setProjectAmenity(admin, projectId, amenityId, {
      availability: 'CHARGEABLE',
      charge_calc_method: 'FIXED',
      charge_amount: 50000,
      applicability: 'SELECTED_UNITS',
      selected_unit_ids: [unitAId],
    } as any);
    await PricingService.applyRecalculateProject(admin, projectId);

    const a = await ProjectUnitService.getUnit(admin, unitAId);
    const b = await ProjectUnitService.getUnit(admin, unitBId);
    expect(a.final_price).toBe(2050000);
    expect(b.final_price).toBe(2000000);
  });

  it('7. The selection survives a second, unrelated project-wide recalculate (not silently dropped)', async () => {
    await PricingService.applyRecalculateProject(admin, projectId);

    const a = await ProjectUnitService.getUnit(admin, unitAId);
    const b = await ProjectUnitService.getUnit(admin, unitBId);
    expect(a.final_price).toBe(2050000);
    expect(b.final_price).toBe(2000000);
  });

  it('8. Removing the project amenity and recalculating clears the charge from every unit', async () => {
    await AmenityService.removeProjectAmenity(admin, projectId, amenityId);
    await PricingService.applyRecalculateProject(admin, projectId);
    const a = await ProjectUnitService.getUnit(admin, unitAId);
    const b = await ProjectUnitService.getUnit(admin, unitBId);
    expect(a.final_price).toBe(2000000);
    expect(b.final_price).toBe(2000000);
  });

  it('9. An INCLUDED (non-chargeable) amenity never affects price', async () => {
    await AmenityService.setProjectAmenity(admin, projectId, amenityId, {
      availability: 'INCLUDED',
    } as any);
    await PricingService.applyRecalculateProject(admin, projectId);
    const a = await ProjectUnitService.getUnit(admin, unitAId);
    expect(a.final_price).toBe(2000000);
    expect(a.price_lines.some((l) => l.label === 'Clubhouse Access')).toBe(false);
  });

  it('10. Deactivating a catalog amenity is rejected as project-scope enforcement for a different company', async () => {
    const outsider: TokenPayload = { ...admin, companyId: companyId + 999 };
    await expect(
      AmenityService.updateCatalogAmenity(outsider, amenityId, { name: 'Hacked' }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
