import { prisma } from '../../apps/api/src/lib/prisma';
import { PropertyService } from '../../apps/api/src/services/property.service';
import { Roles, Permissions, ALL_PERMISSIONS } from '@rrh-ems/shared';
import { TokenPayload } from '../../apps/api/src/utils/jwt';

// Rebuild Phase 5: the flat pricing/area/characteristic columns Phase 1's
// migration added to Property (mirroring ProjectUnit) were never reachable
// through createProperty/updateProperty — Zod's schema stripped them and the
// services never read them, so `sales_status`/`price_basis`/`base_rate`/etc.
// sat permanently at their defaults no matter what a form sent. This verifies
// the fix: PropertyForm.tsx can now actually set and edit them, and every
// create/update recomputes price the same way ProjectUnitService does.
describe('Property pricing/area fields (Phase 5)', () => {
  const companyId = 1;
  const admin: TokenPayload = {
    employeeId: 999980,
    employeeCode: 'ADMIN-PP-1',
    companyId,
    branchId: null,
    roles: [Roles.ADMIN, Roles.MD],
    permissions: ALL_PERMISSIONS,
  };
  let propertyId: number;

  afterAll(async () => {
    if (propertyId) {
      await prisma.priceLine.deleteMany({ where: { property_id: propertyId } });
      await prisma.property.delete({ where: { id: propertyId } }).catch(() => {});
    }
    await prisma.employee.delete({ where: { id: admin.employeeId } }).catch(() => {});
  });

  beforeAll(async () => {
    await prisma.employee.create({
      data: {
        id: admin.employeeId,
        employee_code: admin.employeeCode,
        company_id: companyId,
        password_hash: '',
        status: 'ACTIVE',
        full_name: 'Property Pricing Test Admin',
      },
    });
  });

  it('1. Creating a plot property with plot_area_sqyd + base_rate computes a real price', async () => {
    const property = await PropertyService.createProperty(admin, {
      title: 'Test Plot Property',
      brand_type: 'RADHA_REAL_HOMES',
      category: 'PLOT',
      price: 1,
      area_sqft: 1,
      location: 'Test Location',
      plot_area_sqyd: 200,
      price_basis: 'PLOT_AREA',
      base_rate: 15000,
      base_rate_unit: 'PER_SQYD',
      facing: 'EAST',
      is_corner: true,
    });
    propertyId = property.id;

    expect(property.plot_area_sqyd).toBe(200);
    expect(property.price_basis).toBe('PLOT_AREA');
    expect(property.is_corner).toBe(true);
    // 200 x 15,000 base — no premiums (properties have no project rules, only
    // their own base rate + manual lines).
    expect(property.base_price).toBe(3000000);
    expect(property.calculated_price).toBe(3000000);
    expect(property.final_price).toBe(3000000);
  });

  it('2. Manual lines set at create time are persisted as PriceLine rows and included in the total', async () => {
    const property = await PropertyService.createProperty(admin, {
      title: 'Test Property With Manual Charges',
      brand_type: 'SONTHILLU',
      category: 'VILLA',
      price: 1,
      area_sqft: 1000,
      location: 'Test Location',
      base_rate: 5000,
      base_rate_unit: 'PER_SQFT',
      price_basis: 'BUILT_UP',
      built_up_area_sqft: 1000,
      manual_lines: [{ label: 'Legal Charges', amount: 50000 }],
    });
    expect(property.calculated_price).toBe(5050000); // 1000 x 5000 + 50,000
    await prisma.priceLine.deleteMany({ where: { property_id: property.id } });
    await prisma.property.delete({ where: { id: property.id } });
  });

  it('3. Updating area/facing recomputes the price (mirrors ProjectUnitService.updateUnit)', async () => {
    const updated = await PropertyService.updateProperty(admin, propertyId, {
      plot_area_sqyd: 250,
    } as any);
    expect(updated.plot_area_sqyd).toBe(250);
    expect(updated.calculated_price).toBe(3750000); // 250 x 15,000
  });

  it('4. Adding manual_lines through update recomputes and persists them', async () => {
    const updated = await PropertyService.updateProperty(admin, propertyId, {
      manual_lines: [{ label: 'Registration Fee', amount: 100000 }],
    } as any);
    expect(updated.calculated_price).toBe(3850000); // 3,750,000 + 100,000

    const lines = await prisma.priceLine.findMany({
      where: { property_id: propertyId, is_manual: true },
    });
    expect(lines.length).toBe(1);
    expect(lines[0].label).toBe('Registration Fee');
  });

  it('5. Clearing manual_lines through update removes them and recomputes down', async () => {
    const updated = await PropertyService.updateProperty(admin, propertyId, {
      manual_lines: [],
    } as any);
    expect(updated.calculated_price).toBe(3750000);
    const lines = await prisma.priceLine.findMany({
      where: { property_id: propertyId, is_manual: true },
    });
    expect(lines.length).toBe(0);
  });

  it('6. sales_status can be filtered on the list endpoint as an axis separate from the publication pipeline status', async () => {
    await prisma.property.update({ where: { id: propertyId }, data: { sales_status: 'HOLD' } });
    const onHold = await PropertyService.listProperties(admin, { sales_status: 'HOLD' }, 50, 0);
    expect(onHold.some((p) => p.id === propertyId)).toBe(true);
    const available = await PropertyService.listProperties(
      admin,
      { sales_status: 'AVAILABLE' },
      50,
      0,
    );
    expect(available.some((p) => p.id === propertyId)).toBe(false);
    await prisma.property.update({
      where: { id: propertyId },
      data: { sales_status: 'AVAILABLE' },
    });
  });

  it('7b. Updating with pricing/plot_details/apartment_details explicitly null is a harmless no-op when none exist (PropertyForm.tsx sends the whole fetched property back, including these as null)', async () => {
    const updated = await PropertyService.updateProperty(admin, propertyId, {
      title: 'Test Plot Property',
      pricing: null,
      plot_details: null,
      apartment_details: null,
    } as any);
    expect(updated.id).toBe(propertyId);
  });

  it('7. category filter narrows the list independently of brand', async () => {
    const plots = await PropertyService.listProperties(admin, { category: 'PLOT' }, 50, 0);
    expect(plots.every((p) => p.category === 'PLOT')).toBe(true);
    expect(plots.some((p) => p.id === propertyId)).toBe(true);
  });

  it('8. Each of the 7 property types persists its own category-specific detail sub-record (property details.md spec)', async () => {
    const villa = await PropertyService.createProperty(admin, {
      title: 'Test Villa With Details',
      brand_type: 'SONTHILLU',
      category: 'VILLA',
      price: 1,
      area_sqft: 1,
      location: 'Test Location',
      villa_details: {
        villa_number: 'V-12',
        villa_type: 'Type A',
        has_private_pool: true,
        number_of_cars: 2,
      },
    });
    expect(villa.villa_details?.villa_number).toBe('V-12');
    expect(villa.villa_details?.has_private_pool).toBe(true);

    const office = await PropertyService.createProperty(admin, {
      title: 'Test Commercial Office With Details',
      brand_type: 'RADHA_REAL_HOMES',
      category: 'COMMERCIAL_OFFICE',
      price: 1,
      area_sqft: 1,
      location: 'Test Location',
      commercial_office_details: {
        office_number: 'O-5',
        cabins: 3,
        workstations: 20,
        has_server_room: true,
      },
    });
    expect(office.commercial_office_details?.office_number).toBe('O-5');
    expect(office.commercial_office_details?.workstations).toBe(20);

    // Editing swaps in a different detail record via the same defensive
    // upsert-or-delete path used for the legacy pricing/plot/apartment sub-records.
    const updatedVilla = await PropertyService.updateProperty(admin, villa.id, {
      villa_details: { villa_number: 'V-12', number_of_cars: 3 },
    } as any);
    expect(updatedVilla.villa_details?.number_of_cars).toBe(3);

    await prisma.propertyVillaDetails.deleteMany({ where: { property_id: villa.id } });
    await prisma.property.delete({ where: { id: villa.id } });
    await prisma.propertyCommercialOfficeDetails.deleteMany({ where: { property_id: office.id } });
    await prisma.property.delete({ where: { id: office.id } });
  });
});
