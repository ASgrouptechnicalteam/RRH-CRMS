import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Roles } from '@rrh-ems/shared';

import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';
import mdRoutes from './routes/md';
import reportRoutes from './routes/reports';
import taskRoutes from './routes/tasks';
import performanceRoutes from './routes/performance';
import notificationRoutes from './routes/notifications';
import targetRoutes from './routes/targets';
import employeeRoutes from './routes/employees';
import leadRoutes from './routes/leads';
import propertyRoutes from './routes/properties';
import cpRoutes from './routes/cp';
import siteVisitRoutes from './routes/siteVisits';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import expenseRefundRoutes from './routes/expenseRefunds';
import pushRoutes from './routes/pushSubscriptions';

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();
const p = prisma as any;

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin: process.env.APP_URL || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());

// Body Parser
app.use(express.json());

// Serve uploaded files (expense proof images) — authenticated via the /proof endpoint
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/md', mdRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/performance', performanceRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/targets', targetRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/cp', cpRoutes);
app.use('/api/v1/site-visits', siteVisitRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/expense-refunds', expenseRefundRoutes);
app.use('/api/v1/push', pushRoutes);

// Serve frontend static files from apps/web/dist
app.use(express.static(path.join(process.cwd(), 'apps/web/dist')));

// Handle React routing, return all unmatched non-API requests to the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'apps/web/dist/index.html'));
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Auto-seed Hostinger MySQL Database on startup if empty
const bootstrapHostingerDatabase = async () => {
  try {
    const empCount = await p.employee.count();
    if (empCount > 0) {
      console.log(`[database]: Connected to Hostinger MySQL (${empCount} active employee records loaded)`);
      return;
    }

    console.log('[database]: Seeding Hostinger MySQL database with full team roster...');

    const company = await p.company.upsert({
      where: { code: 'RRH' },
      update: { name: 'Radha Real Homes' },
      create: { name: 'Radha Real Homes', code: 'RRH', property_type_group: 'RADHA_REAL_HOMES' },
    });

    const mainBranch =
      (await p.branch.findFirst({ where: { company_id: company.id, name: 'Miyapur (Main Branch)' } })) ||
      (await p.branch.create({ data: { company_id: company.id, name: 'Miyapur (Main Branch)' } }));

    const secondaryBranch =
      (await p.branch.findFirst({ where: { company_id: company.id, name: 'Tarnaka Branch' } })) ||
      (await p.branch.create({ data: { company_id: company.id, name: 'Tarnaka Branch' } }));

    const rolesToSeed = [
      { name: Roles.MD, is_system: true, is_invisible: false },
      { name: Roles.ADMIN, is_system: true, is_invisible: true },
      { name: Roles.HR_MANAGER, is_system: false, is_invisible: false },
      { name: Roles.MARKETING_DIRECTOR, is_system: false, is_invisible: false },
      { name: Roles.PROJECT_MANAGER, is_system: false, is_invisible: false },
      { name: Roles.DIGITAL_LEAD_OPERATOR, is_system: false, is_invisible: false },
      { name: Roles.TELECALLER, is_system: false, is_invisible: false },
      { name: Roles.CHANNEL_PARTNER_MANAGER, is_system: false, is_invisible: false },
      { name: Roles.DIGITAL_MARKETING_HEAD, is_system: false, is_invisible: false },
      { name: Roles.FINANCE, is_system: false, is_invisible: false },
      { name: Roles.AGENT, is_system: false, is_invisible: false },
      { name: Roles.STAFF, is_system: false, is_invisible: false },
    ];

    const roleMap: Record<string, any> = {};
    for (const rDef of rolesToSeed) {
      const role = await p.role.upsert({
        where: { name: rDef.name },
        update: { is_invisible: rDef.is_invisible, is_system: rDef.is_system },
        create: rDef,
      });
      roleMap[rDef.name] = role;
    }

    const passwordHash = await bcrypt.hash('Password@123', 12);

    const initialEmployees = [
      { roleName: Roles.MD, code: 'RRH-EX-001', name: 'Radha Krishna (MD)', phone: '+91 99887 76655', email: 'rrh-ex-001@radharealhomes.com', dept: 'Executive Management', title: 'Managing Director', salary: 150000, exempt: true, branchId: mainBranch.id },
      { roleName: Roles.ADMIN, code: 'RRH-EX-002', name: 'System Technical Admin', phone: '+91 99887 76644', email: 'rrh-ex-002@radharealhomes.com', dept: 'IT Systems', title: 'Technical Administrator', salary: 120000, exempt: true, branchId: mainBranch.id },
      { roleName: Roles.HR_MANAGER, code: 'RRH-HR-001', name: 'Sunitha Varma (HR)', phone: '+91 98765 43210', email: 'rrh-hr-001@radharealhomes.com', dept: 'Human Resources', title: 'HR Operations Manager', salary: 75000, exempt: true, branchId: secondaryBranch.id },
      { roleName: Roles.TELECALLER, code: 'RRH-SL-001', name: 'Praveen Kumar', phone: '+91 98765 11111', email: 'rrh-sl-001@radharealhomes.com', dept: 'Sales & Leads', title: 'Senior Lead Telecaller', salary: 35000, exempt: false, branchId: mainBranch.id },
      { roleName: Roles.TELECALLER, code: 'RRH-SL-002', name: 'Anusha Reddy', phone: '+91 98765 22222', email: 'rrh-sl-002@radharealhomes.com', dept: 'Sales & Leads', title: 'Lead Qualification Agent', salary: 32000, exempt: false, branchId: secondaryBranch.id },
      { roleName: Roles.DIGITAL_LEAD_OPERATOR, code: 'RRH-MK-001', name: 'Karthik Rao', phone: '+91 98765 33333', email: 'rrh-mk-001@radharealhomes.com', dept: 'Marketing', title: 'Digital Marketing Operator', salary: 45000, exempt: false, branchId: mainBranch.id },
      { roleName: Roles.CHANNEL_PARTNER_MANAGER, code: 'RRH-MK-002', name: 'Vikram Sharma', phone: '+91 98765 44444', email: 'rrh-mk-002@radharealhomes.com', dept: 'Marketing', title: 'Channel Partner Manager', salary: 55000, exempt: false, branchId: secondaryBranch.id },
      { roleName: Roles.PROJECT_MANAGER, code: 'RRH-OP-001', name: 'Srinivas Raju', phone: '+91 98765 55555', email: 'rrh-op-001@radharealhomes.com', dept: 'Operations', title: 'Site Operations Director', salary: 65000, exempt: false, branchId: mainBranch.id },
      { roleName: Roles.FINANCE, code: 'RRH-FN-001', name: 'Meenakshi Iyer', phone: '+91 98765 66666', email: 'rrh-fn-001@radharealhomes.com', dept: 'Finance', title: 'Senior Accounts Manager', salary: 60000, exempt: false, branchId: secondaryBranch.id },
    ];

    for (const empDef of initialEmployees) {
      await p.employee.create({
        data: {
          employee_code: empDef.code,
          full_name: empDef.name,
          phone: empDef.phone,
          email: empDef.email,
          company_id: company.id,
          branch_id: empDef.branchId,
          password_hash: passwordHash,
          status: 'ACTIVE',
          attendance_required: !empDef.exempt,
          first_login_done: true,
          job_title: empDef.title,
          department: empDef.dept,
          employment_type: 'FULL_TIME',
          salary_ctc: empDef.salary,
          current_address: 'Flat 402, Royal Residency, Miyapur, Hyderabad, TS - 500049',
          permanent_address: 'Plot 88, Green Meadows, Hyderabad, TS - 500081',
          blood_group: 'O+',
          pan_number: `${empDef.code.substring(4, 7)}DE1234F`,
          aadhaar_number: '123456789012',
          bank_name: 'HDFC Bank',
          bank_account_number: '5010023456789',
          bank_ifsc: 'HDFC0001234',
          bank_branch: 'Miyapur Main',
          emergency_contact_name: 'Emergency Contact',
          emergency_contact_relation: 'Spouse',
          emergency_contact_phone: '+91 99887 76600',
          background_education: 'B.Tech / MBA (First Class)',
          date_of_joining: new Date('2024-01-15T00:00:00.000Z'),
          roles: {
            create: { role_id: roleMap[empDef.roleName].id },
          },
        },
      });
    }

    console.log('[database]: Hostinger MySQL database seeded successfully on startup!');

    // Seed Sample Leads if 0 leads exist
    const leadCount = await p.lead.count();
    if (leadCount === 0) {
      console.log('[database]: Seeding sample leads for Phase 3 testing...');
      const telecaller = await p.employee.findFirst({ where: { employee_code: 'RRH-SL-001' } });
      const md = await p.employee.findFirst({ where: { employee_code: 'RRH-EX-001' } });

      const sampleLeads = [
        { name: 'Venkatesh Rao', phone: '+91 99001 12233', email: 'venkatesh.rao@gmail.com', source: 'WEBSITE', pref: 'RESIDENTIAL_VILLA', budget: 18000000, loc: 'Gachibowli / Miyapur', status: 'QUALIFIED', notes: 'Interested in 4BHK Gated Villa in Sonthillu Project.' },
        { name: 'Sunita & K. Sharma', phone: '+91 99002 23344', email: 'ksharma@techcorp.com', source: 'FACEBOOK_ADS', pref: 'APARTMENT', budget: 9500000, loc: 'Tarnaka / Uppal', status: 'SITE_VISIT_SCHEDULED', notes: 'Site visit scheduled for Saturday 3:30 PM.' },
        { name: 'Dr. Anand Kumar', phone: '+91 99003 34455', email: 'dranand@apollo.org', source: 'GOOGLE_ADS', pref: 'COMMERCIAL_PLOT', budget: 35000000, loc: 'Miyapur Commercial Belt', status: 'CONTACTED', notes: 'Looking for 400 sq. yard commercial land for clinic.' },
        { name: 'Priyanka Reddy', phone: '+91 99004 45566', email: 'priyanka.r@outlook.com', source: 'WALK_IN', pref: 'RESIDENTIAL_VILLA', budget: 22000000, loc: 'Miyapur Main', status: 'WON', notes: 'Deal closed! Token advance ₹5,00,000 received.' },
        { name: 'Nagarjuna Constructions Lead', phone: '+91 99005 56677', email: 'procurement@nagarjunabuild.com', source: 'REFERRAL', pref: 'AGRICULTURAL_LAND', budget: 50000000, loc: 'Outskirts / Sangareddy Highway', status: 'NEW', notes: 'Bulk land requirement for warehousing.' },
      ];

      for (let i = 0; i < sampleLeads.length; i++) {
        const item = sampleLeads[i];
        const lead = await p.lead.create({
          data: {
            lead_code: `RRH-LD-2026-000${i + 1}`,
            company_id: company.id,
            customer_name: item.name,
            phone: item.phone,
            email: item.email,
            source: item.source,
            status: item.status,
            assigned_to_id: telecaller?.id,
            assigned_at: new Date(),
            assignment_type: 'PERFORMANCE_WEIGHTED',
            property_type_preference: item.pref,
            budget_max: item.budget,
            preferred_location: item.loc,
            notes: item.notes,
            created_by_id: md?.id || 1,
          },
        });

        await p.leadActivity.create({
          data: {
            lead_id: lead.id,
            actor_id: md?.id || 1,
            activity_type: 'LEAD_CREATED',
            notes: `Initial registration of Lead ${lead.lead_code} (${item.name})`,
          },
        });
      }
      console.log('[database]: Phase 3 Sample leads created successfully!');
    }

    // Seed Sample Properties if 0 properties exist
    const propCount = await p.property.count();
    if (propCount === 0) {
      console.log('[database]: Seeding sample properties for Phase 4 testing...');
      const pm = await p.employee.findFirst({ where: { employee_code: 'RRH-OP-001' } });
      const md = await p.employee.findFirst({ where: { employee_code: 'RRH-EX-001' } });

      const sampleProps = [
        { code: 'RRH-PR-2026-0001', title: 'Sonthillu Phase-1 Luxury 3BHK East-Facing Villa', brand: 'SONTHILLU', cat: 'VILLA', price: 18500000, sqft: 2400, bhk: 3, bath: 3, facing: 'EAST', loc: 'Miyapur Main Road', addr: 'Plot 42, Sonthillu Luxury Gated Community, Miyapur, Hyderabad', status: 'LIVE', desc: 'Exclusive 3BHK Gated Community Villa with private garden.' },
        { code: 'RRH-PR-2026-0002', title: 'Sonthillu Skyline 2BHK Premium Apartment', brand: 'SONTHILLU', cat: 'APARTMENT', price: 8800000, sqft: 1350, bhk: 2, bath: 2, facing: 'NORTH_EAST', loc: 'Tarnaka Metro Hub', addr: 'Tower B, 4th Floor, Sonthillu Skyline, Tarnaka, Hyderabad', status: 'PENDING_MD_APPROVAL', desc: 'Modern 2BHK flat adjacent to Tarnaka Metro station.' },
        { code: 'RRH-PR-2026-0003', title: 'Radha Commercial Highway Frontage Plot (400 Sq. Yds)', brand: 'RADHA_REAL_HOMES', cat: 'PLOT', price: 32000000, sqft: 3600, bhk: null, bath: null, facing: 'NORTH', loc: 'Miyapur Commercial Belt', addr: 'Survey No. 118, Main NH-65 Highway Frontage, Miyapur, Hyderabad', status: 'PENDING_DM_POLISH', desc: 'Prime 100ft road facing commercial plot.' },
        { code: 'RRH-PR-2026-0004', title: 'Radha Warehousing & Logistics Plot (2.5 Acres)', brand: 'RADHA_REAL_HOMES', cat: 'COMMERCIAL', price: 75000000, sqft: 108900, bhk: null, bath: null, facing: 'EAST', loc: 'Sangareddy Industrial Zone', addr: 'Sy. No. 405, Sangareddy Outer Ring Road Junction, Hyderabad', status: 'PENDING_VERIFICATION', desc: 'Heavy industrial & logistics zone land.' },
      ];

      for (const item of sampleProps) {
        const prop = await p.property.create({
          data: {
            property_code: item.code,
            company_id: company.id,
            title: item.title,
            description: item.desc,
            brand_type: item.brand,
            category: item.cat,
            price: item.price,
            area_sqft: item.sqft,
            location: item.loc,
            address: item.addr,
            bedrooms: item.bhk,
            bathrooms: item.bath,
            facing: item.facing,
            status: item.status,
            assigned_pm_id: pm?.id,
            created_by_id: md?.id || 1,
          },
        });

        await p.propertyVerificationLog.create({
          data: {
            property_id: prop.id,
            actor_id: md?.id || 1,
            from_status: 'DRAFT',
            to_status: item.status,
            notes: `Initial submission of Property ${item.code} (${item.title}) under ${item.brand}`,
          },
        });
      }
      console.log('[database]: Phase 4 Sample properties created successfully!');
    }

    // Seed Sample Channel Partners & Hierarchical Payouts if 0 CPs exist
    const cpCount = await p.channelPartner.count();
    if (cpCount === 0) {
      console.log('[database]: Seeding sample Channel Partners & MLM payouts for Phase 6 testing...');
      const parentCP = await p.channelPartner.create({
        data: {
          cp_code: 'RRH-CP-2026-0001',
          company_id: company.id,
          firm_name: 'Royal Realty Networks (Master Upline)',
          contact_name: 'Vikramaditya Rao',
          phone: '+91 98888 11111',
          email: 'vikram@royalrealty.com',
          tier: 'PLATINUM',
          rera_number: 'P02400001111',
          status: 'ACTIVE',
        },
      });

      const childCP = await p.channelPartner.create({
        data: {
          cp_code: 'RRH-CP-2026-0002',
          company_id: company.id,
          firm_name: 'Apex Property Associates (Downline)',
          contact_name: 'Suresh Verma',
          phone: '+91 98888 22222',
          email: 'suresh@apexprop.com',
          tier: 'GOLD',
          upline_cp_id: parentCP.id,
          rera_number: 'P02400002222',
          status: 'ACTIVE',
        },
      });

      // Sample Payouts for ₹1.85 Cr Deal
      const dealAmount = 18500000;
      await p.cPPayout.create({
        data: {
          payout_code: 'RRH-PO-2026-0001',
          cp_id: childCP.id,
          deal_amount: dealAmount,
          tier_rate_percent: 2.5,
          commission_amount: (dealAmount * 2.5) / 100,
          level: 1,
          status: 'PENDING_MD_APPROVAL',
          notes: 'Level 1 Direct Sale Commission (Gold Tier @ 2.5%) for Sonthillu Villa Deal',
        },
      });

      await p.cPPayout.create({
        data: {
          payout_code: 'RRH-PO-2026-0002',
          cp_id: parentCP.id,
          deal_amount: dealAmount,
          tier_rate_percent: 0.5,
          commission_amount: (dealAmount * 0.5) / 100,
          level: 2,
          status: 'PENDING_MD_APPROVAL',
          notes: `Level 2 Upline Override Commission from ${childCP.firm_name} sale (0.5%)`,
        },
      });
      console.log('[database]: Phase 6 Sample Channel Partners & MLM payouts created successfully!');
    }

    // Seed Sample Site Visit Booking if 0 site visits exist
    const svCount = await p.siteVisitBooking.count();
    if (svCount === 0) {
      const sampleLead = await p.lead.findFirst();
      const telecaller = await p.employee.findFirst({ where: { employee_code: 'RRH-SL-001' } });
      const pm = await p.employee.findFirst({ where: { employee_code: 'RRH-OP-001' } });

      if (sampleLead && telecaller) {
        await p.siteVisitBooking.create({
          data: {
            booking_code: 'RRH-SV-2026-0001',
            lead_id: sampleLead.id,
            telecaller_id: telecaller.id,
            project_manager_id: pm ? pm.id : null,
            scheduled_date: new Date(Date.now() + 86400000),
            status: 'PENDING_VERIFICATION',
            verification_call_notes: 'Booked by Telecaller RRH-SL-001. Awaiting verification call to confirm client schedule.',
          },
        });
        console.log('[database]: Sample Site Visit booking created successfully!');
      }
    }
  } catch (err: any) {
    console.error('[database error]:', err.message);
  }
};

const server = app.listen(port, () => {
  console.log(`[server]: API running at http://localhost:${port}`);
  bootstrapHostingerDatabase();
});
