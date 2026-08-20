import request from 'supertest';
import app from '../../apps/api/src/server';
import { Roles } from '@rrh-ems/shared';
import { PrismaClient } from '@prisma/client';
import { setupDeterministicTestUsers, deterministicUsers, crossOrgUsers } from '../fixtures/testUsers';

const prisma = new PrismaClient();
const p = prisma as any;

// Unique per run so repeated executions never collide with prior-run data
// (Lead/Customer duplicate detection is scoped by (company_id, phone)).
const runId = Date.now().toString().slice(-8);
const phones: string[] = [];
let phoneSeq = 0;
const mkPhone = () => {
  const ph = `+91${runId}${String(++phoneSeq).padStart(2, '0')}`;
  phones.push(ph);
  return ph;
};

describe('Phase 12 Packet 12-1 — Attribution Propagation', () => {
  let mdToken: string;
  let telecallerAToken: string;
  let telecallerBToken: string;

  let companyId: number;
  let mdId: number;
  let telecallerAId: number;

  const leadIds: number[] = [];
  const oppIds: number[] = [];
  const propertyIds: number[] = [];

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL_TEST) {
      throw new Error('Safety check failed: tests must run against isolated test database.');
    }

    await setupDeterministicTestUsers();

    const getAuth = async (code: string, idx: number) => {
      const res = await request(app).post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.10.${idx}`)
        .send({ employee_code: code, password: 'Password@123' });
      if (res.status !== 200) {
        throw new Error(`Login failed for ${code}: ${res.status} ${JSON.stringify(res.body)}`);
      }
      return res.body.accessToken;
    };

    const getCode = (role: string) => deterministicUsers.find(u => u.roles[0] === role)!.employee_code;
    const tcBCode = crossOrgUsers[0].employee_code;

    mdToken = await getAuth(getCode(Roles.MD), 1);
    telecallerAToken = await getAuth(getCode(Roles.TELECALLER), 3);
    telecallerBToken = await getAuth(tcBCode, 4);

    const decode = (t: string) => JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString());
    companyId = decode(mdToken).companyId;
    mdId = decode(mdToken).employeeId;
    telecallerAId = decode(telecallerAToken).employeeId;
  });

  afterAll(async () => {
    try {
      const customers = await p.customer.findMany({ where: { phone: { in: phones } } });
      const customerIds = customers.map((c: any) => c.id);
      await p.booking.deleteMany({ where: { customer_id: { in: customerIds } } });
      await p.opportunity.deleteMany({ where: { id: { in: oppIds } } });
      await p.customer.deleteMany({ where: { id: { in: customerIds } } });
      await p.lead.deleteMany({ where: { id: { in: leadIds } } });
      await p.property.deleteMany({ where: { id: { in: propertyIds } } });
    } catch (e) {
      // best-effort cleanup only
    }
    await prisma.$disconnect();
  });

  const createLead = async (attrs: any = {}) => {
    const res = await request(app)
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${mdToken}`)
      .send({ customer_name: 'Attribution Test Lead', phone: mkPhone(), ...attrs });
    expect(res.status).toBe(201);
    expect(res.body.lead).toBeDefined();
    leadIds.push(res.body.lead.id);
    return res.body.lead;
  };

  const createLiveProperty = async () => {
    const prop = await p.property.create({
      data: {
        property_code: `TEST-PROP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        title: 'Attribution Test Property',
        price: 5000000,
        area_sqft: 1500,
        location: 'Test Location',
        status: 'LIVE',
        company: { connect: { id: companyId } },
        created_by: { connect: { id: mdId } },
      },
    });
    propertyIds.push(prop.id);
    return prop;
  };

  const createOpportunity = async (leadId: number, propertyId?: number) => {
    const res = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${telecallerAToken}`)
      .send({ lead_id: leadId, owner_id: telecallerAId, ...(propertyId ? { property_id: propertyId } : {}) });
    expect(res.status).toBe(201);
    expect(res.body.opportunity).toBeDefined();
    oppIds.push(res.body.opportunity.id);
    return res.body.opportunity;
  };

  const convertLeadToCustomer = async (leadId: number, token: string = telecallerAToken) =>
    request(app)
      .post(`/api/v1/leads/${leadId}/convert-to-customer`)
      .set('Authorization', `Bearer ${token}`);
describe('Lead capture', () => {
    it('stores all five attribution fields', async () => {
      const lead = await createLead({
        source: 'WEBSITE',
        campaign: 'SUMMER_SALE_2024',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'summer-sale',
        notes: 'Phase 12 Packet 12-1 attribution test lead.',
      });

      expect(lead.source).toBe('WEBSITE');
      expect(lead.campaign).toBe('SUMMER_SALE_2024');
      expect(lead.utm_source).toBe('google');
      expect(lead.utm_medium).toBe('cpc');
      expect(lead.utm_campaign).toBe('summer-sale');
    });
  });

  describe('Lead → Customer', () => {
    it('preserves all five attribution fields', async () => {
      const lead = await createLead({
        source: 'FACEBOOK_ADS',
        campaign: 'FB_CAMPAIGN',
        utm_source: 'facebook',
        utm_medium: 'paid_post',
        utm_campaign: 'fb-campaign',
      });

      const res = await convertLeadToCustomer(lead.id);
      expect(res.status).toBe(201);
      expect(res.body.customer).toBeDefined();
      expect(res.body.customer.source).toBe('FACEBOOK_ADS');
      expect(res.body.customer.campaign).toBe('FB_CAMPAIGN');
      expect(res.body.customer.utm_source).toBe('facebook');
      expect(res.body.customer.utm_medium).toBe('paid_post');
      expect(res.body.customer.utm_campaign).toBe('fb-campaign');
    });
  });

  describe('Lead → Opportunity', () => {
    it('preserves all five attribution fields', async () => {
      const lead = await createLead({
        source: 'GOOGLE_ADS',
        campaign: 'GOOGLE_BRAND',
        utm_source: 'google',
        utm_medium: 'search',
        utm_campaign: 'google-brand',
      });

      const opp = await createOpportunity(lead.id);
      expect(opp.source).toBe('GOOGLE_ADS');
      expect(opp.campaign).toBe('GOOGLE_BRAND');
      expect(opp.utm_source).toBe('google');
      expect(opp.utm_medium).toBe('search');
      expect(opp.utm_campaign).toBe('google-brand');
    });
  });

  describe('Opportunity → Booking', () => {
    it('preserves all five attribution fields', async () => {
      const lead = await createLead({
        source: 'WEBSITE',
        campaign: 'WELCOME_SERIES',
        utm_source: 'website',
        utm_medium: 'referral',
        utm_campaign: 'welcome-series',
      });

      const property = await createLiveProperty();
      const opp = await createOpportunity(lead.id, property.id);
      await p.opportunity.update({ where: { id: opp.id }, data: { stage: 'BOOKING_INITIATED' } });

      const res = await request(app)
        .post(`/api/v1/opportunities/${opp.id}/convert-to-booking`)
        .set('Authorization', `Bearer ${telecallerAToken}`)
        .send({ agreed_price: 4900000, booking_amount: 100000, notes: 'Attribution booking test' });

      expect(res.status).toBe(201);
      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.source).toBe('WEBSITE');
      expect(res.body.booking.campaign).toBe('WELCOME_SERIES');
      expect(res.body.booking.utm_source).toBe('website');
      expect(res.body.booking.utm_medium).toBe('referral');
      expect(res.body.booking.utm_campaign).toBe('welcome-series');
    });
  });
describe('End-to-end attribution chain', () => {
    it('full funnel: Lead → Customer → Opportunity → Booking', async () => {
      const lead = await createLead({
        source: 'BULK_UPLOAD',
        campaign: 'BULK_IMPORT',
        utm_source: 'csv',
        utm_medium: 'import',
        utm_campaign: 'bulk-import-2024',
      });

      // Lead → Customer
      const custRes = await convertLeadToCustomer(lead.id);
      expect(custRes.status).toBe(201);
      expect(custRes.body.customer.source).toBe('BULK_UPLOAD');
      expect(custRes.body.customer.campaign).toBe('BULK_IMPORT');
      expect(custRes.body.customer.utm_source).toBe('csv');
      expect(custRes.body.customer.utm_medium).toBe('import');
      expect(custRes.body.customer.utm_campaign).toBe('bulk-import-2024');

      // Lead → Opportunity
      const property = await createLiveProperty();
      const opp = await createOpportunity(lead.id, property.id);
      expect(opp.source).toBe('BULK_UPLOAD');
      expect(opp.campaign).toBe('BULK_IMPORT');
      expect(opp.utm_source).toBe('csv');
      expect(opp.utm_medium).toBe('import');
      expect(opp.utm_campaign).toBe('bulk-import-2024');

      // Opportunity → Booking (customer already exists from lead conversion — idempotent)
      await p.opportunity.update({ where: { id: opp.id }, data: { stage: 'BOOKING_INITIATED' } });
      const bookingRes = await request(app)
        .post(`/api/v1/opportunities/${opp.id}/convert-to-booking`)
        .set('Authorization', `Bearer ${telecallerAToken}`)
        .send({ agreed_price: 4900000, booking_amount: 100000, notes: 'Full funnel attribution test' });
      expect(bookingRes.status).toBe(201);
      expect(bookingRes.body.booking.source).toBe('BULK_UPLOAD');
      expect(bookingRes.body.booking.campaign).toBe('BULK_IMPORT');
      expect(bookingRes.body.booking.utm_source).toBe('csv');
      expect(bookingRes.body.booking.utm_medium).toBe('import');
      expect(bookingRes.body.booking.utm_campaign).toBe('bulk-import-2024');
    });
  });

  describe('Null handling', () => {
    it('null campaign/UTM remain null on Lead', async () => {
      const lead = await createLead({ source: 'MANUAL_ENTRY' });
      expect(lead.campaign).toBeNull();
      expect(lead.utm_source).toBeNull();
      expect(lead.utm_medium).toBeNull();
      expect(lead.utm_campaign).toBeNull();
    });

    it('null UTM fields remain null through conversion', async () => {
      const lead = await createLead({ source: 'MANUAL_ENTRY', campaign: 'TEST_CAMPAIGN' });
      const res = await convertLeadToCustomer(lead.id);
      expect(res.status).toBe(201);
      expect(res.body.customer.campaign).toBe('TEST_CAMPAIGN');
      expect(res.body.customer.utm_source).toBeNull();
      expect(res.body.customer.utm_medium).toBeNull();
      expect(res.body.customer.utm_campaign).toBeNull();
    });
  });

  describe('Company isolation', () => {
    it('attribution data cannot cross company boundaries', async () => {
      const lead = await createLead({ source: 'WEBSITE', campaign: 'CROSS_COMPANY' });

      // A different company's telecaller must not be able to convert or read the lead.
      const convertRes = await convertLeadToCustomer(lead.id, telecallerBToken);
      expect([403, 404]).toContain(convertRes.status);

      // Read-isolation check via the real scoped read endpoint: `getLeadById` returns
      // null for leads outside the caller's company, so the route yields 404.
      const readRes = await request(app)
        .get(`/api/v1/leads/${lead.id}/opportunities`)
        .set('Authorization', `Bearer ${telecallerBToken}`);
      expect([403, 404]).toContain(readRes.status);
    });
  });
});
