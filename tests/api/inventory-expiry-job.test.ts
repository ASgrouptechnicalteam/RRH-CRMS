import { prisma } from '../../apps/api/src/lib/prisma';
import { inventoryLockAndHoldExpirySweepJob } from '../../apps/api/src/jobs/tasks';

// Covers the two problems this job closes (see its doc comment in jobs/tasks.ts):
// 1. An expired LOCKED/RESERVED item is reclaimed proactively, and a still-PENDING
//    booking sitting on that expired lock is cancelled rather than left stale.
// 2. An expired manual HOLD reverts to AVAILABLE.
describe('Inventory Lock & Hold Expiry Sweep', () => {
  const companyId = 1;
  const projectId = 8880260;
  let propertyId: number;
  let unitId: number;
  let heldPropertyId: number;
  let heldUnitId: number;
  let staleBookingId: number;
  let customerId: number;

  beforeAll(async () => {
    await prisma.project.create({
      data: {
        id: projectId,
        project_code: `TEST-EXP-${Date.now()}`,
        company_id: companyId,
        name: 'Expiry Sweep Test Project',
        location: 'Test Location',
        slug: `test-exp-${Date.now()}`,
      },
    });

    const customer = await prisma.customer.create({
      data: {
        customer_code: `TEST-EXP-CUST-${Date.now()}`,
        company_id: companyId,
        first_name: 'Expiry',
        last_name: 'Test',
        phone: `9${Date.now().toString().slice(-9)}`,
      },
    });
    customerId = customer.id;

    const past = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    const property = await prisma.property.create({
      data: {
        property_code: `TEST-EXP-PROP-${Date.now()}`,
        company_id: companyId,
        title: 'Expiry Test Property',
        brand_type: 'SONTHILLU',
        category: 'PLOT',
        final_price: 1000000,
        area_sqft: 1000,
        location: 'Test Location',
        status: 'LOCKED',
        locked_until: past,
      },
    });
    propertyId = property.id;

    const staleBooking = await prisma.booking.create({
      data: {
        booking_code: `TEST-EXP-BK-${Date.now()}`,
        company_id: companyId,
        customer_id: customerId,
        property_id: propertyId,
        status: 'PENDING',
        agreed_price: 1000000,
        booking_amount: 50000,
        balance_amount: 950000,
      },
    });
    staleBookingId = staleBooking.id;
    await prisma.property.update({
      where: { id: propertyId },
      data: { locked_by_booking_id: staleBookingId },
    });

    const unit = await prisma.projectUnit.create({
      data: {
        unit_code: `TEST-EXP-UNIT-${Date.now()}`,
        project_id: projectId,
        company_id: companyId,
        unit_number: 'EXP-001',
        unit_type: 'PLOT',
        sales_status: 'RESERVED',
        locked_until: past,
      },
    });
    unitId = unit.id;

    const heldProperty = await prisma.property.create({
      data: {
        property_code: `TEST-EXP-HOLD-PROP-${Date.now()}`,
        company_id: companyId,
        title: 'Held Property',
        brand_type: 'SONTHILLU',
        category: 'PLOT',
        final_price: 500000,
        area_sqft: 500,
        location: 'Test Location',
        status: 'LIVE',
        sales_status: 'HOLD',
        hold_until: past,
      },
    });
    heldPropertyId = heldProperty.id;

    const heldUnit = await prisma.projectUnit.create({
      data: {
        unit_code: `TEST-EXP-HOLD-UNIT-${Date.now()}`,
        project_id: projectId,
        company_id: companyId,
        unit_number: 'EXP-002',
        unit_type: 'PLOT',
        sales_status: 'HOLD',
        hold_until: past,
      },
    });
    heldUnitId = heldUnit.id;
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { property_id: propertyId } });
    await prisma.projectUnit.deleteMany({ where: { project_id: projectId } });
    await prisma.property.deleteMany({ where: { id: { in: [propertyId, heldPropertyId] } } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.customer.delete({ where: { id: customerId } });
  });

  it('releases an expired property lock back to LIVE and cancels the stale PENDING booking', async () => {
    await inventoryLockAndHoldExpirySweepJob();

    const property = await prisma.property.findUniqueOrThrow({ where: { id: propertyId } });
    expect(property.status).toBe('LIVE');
    expect(property.locked_until).toBeNull();
    expect(property.locked_by_booking_id).toBeNull();

    const booking = await prisma.booking.findUniqueOrThrow({ where: { id: staleBookingId } });
    expect(booking.status).toBe('CANCELLED');
  });

  it('releases an expired ProjectUnit reservation back to AVAILABLE', async () => {
    const unit = await prisma.projectUnit.findUniqueOrThrow({ where: { id: unitId } });
    expect(unit.sales_status).toBe('AVAILABLE');
    expect(unit.locked_until).toBeNull();
  });

  it('clears an expired HOLD on a property back to AVAILABLE', async () => {
    const property = await prisma.property.findUniqueOrThrow({ where: { id: heldPropertyId } });
    expect(property.sales_status).toBe('AVAILABLE');
    expect(property.hold_until).toBeNull();
  });

  it('clears an expired HOLD on a unit back to AVAILABLE', async () => {
    const unit = await prisma.projectUnit.findUniqueOrThrow({ where: { id: heldUnitId } });
    expect(unit.sales_status).toBe('AVAILABLE');
    expect(unit.hold_until).toBeNull();
  });

  it('is idempotent — running it again with nothing expired changes nothing and does not throw', async () => {
    await expect(inventoryLockAndHoldExpirySweepJob()).resolves.not.toThrow();
    const property = await prisma.property.findUniqueOrThrow({ where: { id: propertyId } });
    expect(property.status).toBe('LIVE');
  });
});
