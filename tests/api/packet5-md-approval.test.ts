import request from 'supertest';
import app from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { setupDeterministicTestUsers, deterministicUsers } from '../fixtures/testUsers';
import { Roles } from '@rrh-ems/shared';


const p = prisma as any;

describe('Phase 9 Packet 5 - MD Approval & Transaction Authority', () => {
  let companyId: number;
  let adminEmployeeId: number;

  let tokenAdmin: string;
  let tokenFinance: string;
  let tokenTelecaller: string;
  let tokenMD: string;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getAuth = async (code: string) => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          employee_code: code,
          password: 'Password@123',
        });
      if (res.status !== 200) throw new Error(`Login failed for ${code}`);
      return res.body.accessToken;
    };

    const adminCode = deterministicUsers.find(u => u.roles[0] === Roles.ADMIN)!.employee_code;
    const financeCode = deterministicUsers.find(u => u.roles[0] === Roles.FINANCE)!.employee_code;
    const telecallerCode = deterministicUsers.find(u => u.roles[0] === Roles.TELECALLER)!.employee_code;
    const mdCode = deterministicUsers.find(u => u.roles[0] === Roles.MD)!.employee_code;

    tokenAdmin = await getAuth(adminCode);
    tokenFinance = await getAuth(financeCode);
    tokenTelecaller = await getAuth(telecallerCode);
    tokenMD = await getAuth(mdCode);

    const decoded = JSON.parse(Buffer.from(tokenAdmin.split('.')[1], 'base64').toString());
    companyId = decoded.companyId;
    adminEmployeeId = decoded.employeeId;

    // Clean up — Document and CustomerNotification both FK to Customer
    // (onDelete: Restrict), so they must be removed before customer.deleteMany.
    // Document is cleared first because it also FK-references booking/opportunity/lead/property.
    await p.integrationEvent.deleteMany({});
    await p.auditEvent.deleteMany({});
    await p.document.deleteMany({});
    await p.customerNotification.deleteMany({});
    await p.booking.deleteMany({});
    await p.opportunity.deleteMany({});
    await p.lead.deleteMany({});
    await p.property.deleteMany({});
    await p.customer.deleteMany({});
  });

  afterAll(async () => {
    await p.integrationEvent.deleteMany({});
    await prisma.$disconnect();
  });

  const setupBookingAndOpp = async (hasKYC: boolean = true) => {
    const customer = await p.customer.create({
      data: {
        company_id: companyId,
        first_name: 'Test',
        last_name: 'MD_Approval',
        phone: `99999${Math.floor(Math.random() * 10000)}`,
        status: 'NEW',
        customer_code: `C-MD-${Date.now()}`,
        pan_number: hasKYC ? 'ABCDE1234F' : null,
        aadhaar_number: hasKYC ? '123456789012' : null,
      }
    });

    const property = await p.property.create({
      data: {
        title: 'MD Test Prop',
        company_id: companyId,
        status: 'LOCKED',
        price: 10000000,
        bedrooms: 3,
        area_sqft: 1000,
        facing: 'EAST',
        property_code: `P-MD-${Date.now()}`,
        location: 'MD Location',
        created_by_id: adminEmployeeId,
      }
    });

    const booking = await p.booking.create({
      data: {
        company_id: companyId,
        booking_code: `B-MD-${Date.now()}`,
        customer_id: customer.id,
        property_id: property.id,
        agreed_price: 10000000,
        booking_amount: 100000,
        balance_amount: 9900000,
        status: 'INITIATED',
      }
    });

    await p.property.update({
      where: { id: property.id },
      data: { locked_by_booking_id: booking.id, locked_until: new Date(Date.now() + 86400000) }
    });

    const lead = await p.lead.create({
      data: {
        company_id: companyId,
        lead_code: `L-MD-${Date.now()}`,
        customer_name: 'Lead MD',
        phone: `88888${Math.floor(Math.random() * 10000)}`,
        source: 'DIRECT',
        status: 'NEW',
        created_by_id: adminEmployeeId,
        assigned_to_id: adminEmployeeId,
      }
    });

    const opp = await p.opportunity.create({
      data: {
        company_id: companyId,
        opportunity_code: `O-MD-${Date.now()}`,
        lead_id: lead.id,
        property_id: property.id,
        booking_id: booking.id,
        owner_id: adminEmployeeId,
        stage: 'BOOKING_INITIATED'
      }
    });

    return { customer, property, booking, opp, lead };
  };

  it('1. Finance can mark TOKEN_RECEIVED but cannot CONFIRM', async () => {
    const { booking } = await setupBookingAndOpp();

    // Mark Token Received
    const res = await request(app)
      .put(`/api/v1/bookings/${booking.id}/status`)
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({ status: 'TOKEN_RECEIVED' });
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('TOKEN_RECEIVED');

    // Attempt to Confirm (should fail 403)
    const resConfirm = await request(app)
      .post(`/api/v1/bookings/${booking.id}/confirm`)
      .set('Authorization', `Bearer ${tokenFinance}`);
    
    expect(resConfirm.status).toBe(403);
    
    // Attempt via facade (should also fail 403)
    const resFacade = await request(app)
      .put(`/api/v1/bookings/${booking.id}/status`)
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({ status: 'CONFIRMED' });

    expect(resFacade.status).toBe(403);
  });

  it('2. MD cannot confirm if customer lacks KYC', async () => {
    const { booking } = await setupBookingAndOpp(false);

    await request(app)
      .put(`/api/v1/bookings/${booking.id}/status`)
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({ status: 'TOKEN_RECEIVED' });

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/confirm`)
      .set('Authorization', `Bearer ${tokenMD}`);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('KYC (PAN and Aadhaar) is required');
  });

  it('3. MD Confirmation atomically updates Booking, Property, and Opportunity', async () => {
    const { booking, property, opp } = await setupBookingAndOpp(true);

    await request(app)
      .put(`/api/v1/bookings/${booking.id}/status`)
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({ status: 'TOKEN_RECEIVED' });

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/confirm`)
      .set('Authorization', `Bearer ${tokenMD}`);
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');

    const updatedProp = await p.property.findUnique({ where: { id: property.id } });
    expect(updatedProp.status).toBe('BOOKED');

    const updatedOpp = await p.opportunity.findUnique({ where: { id: opp.id } });
    expect(updatedOpp.stage).toBe('BOOKED');

    const audits = await p.auditEvent.findMany({ where: { entity_type: 'Booking', entity_id: booking.id } });
    expect(audits.some((a: any) => a.action === 'BOOKING_CONFIRMED')).toBe(true);
  });

  it('4. MD Cancellation atomically reverts Property and drops Opportunity', async () => {
    const { booking, property, opp } = await setupBookingAndOpp(true);

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/cancel`)
      .set('Authorization', `Bearer ${tokenMD}`);
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');

    const updatedProp = await p.property.findUnique({ where: { id: property.id } });
    expect(updatedProp.status).toBe('LIVE');
    expect(updatedProp.locked_until).toBeNull();
    expect(updatedProp.locked_by_booking_id).toBeNull();

    const updatedOpp = await p.opportunity.findUnique({ where: { id: opp.id } });
    expect(updatedOpp.stage).toBe('DROPPED');
  });

  it('5. Legacy PUT /status facade correctly routes CONFIRMED requests', async () => {
    const { booking } = await setupBookingAndOpp(true);

    await request(app)
      .put(`/api/v1/bookings/${booking.id}/status`)
      .set('Authorization', `Bearer ${tokenFinance}`)
      .send({ status: 'TOKEN_RECEIVED' });

    const res = await request(app)
      .put(`/api/v1/bookings/${booking.id}/status`)
      .set('Authorization', `Bearer ${tokenMD}`)
      .send({ status: 'CONFIRMED' });
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');
  });
});
