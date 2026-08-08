import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
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
import announcementRoutes from './routes/announcement';

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
app.use('/api/v1/announcement', announcementRoutes);

// Serve frontend static files from apps/web/dist
app.use(express.static(path.join(process.cwd(), 'apps/web/dist')));

// Handle React routing or return basic API status if static files don't exist
app.get('*', (req, res) => {
  const indexPath = path.join(process.cwd(), 'apps/web/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ status: 'API is running', message: 'Frontend is hosted separately.' });
  }
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
      { name: Roles.CHANNEL_PARTNER, is_system: false, is_invisible: false },
      { name: Roles.DIGITAL_MARKETING_EXECUTIVE, is_system: false, is_invisible: false },
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

    const passwordHash = await bcrypt.hash('Radhareal@123', 12);

    const initialEmployees = [
      { 
        roleName: Roles.ADMIN, 
        code: 'RRH-ADMIN-001', 
        name: 'Technical Admin', 
        phone: '+91 99999 00001', 
        email: 'admin@radharealhomes.com', 
        dept: 'IT Systems', 
        title: 'System Technical Admin', 
        salary: 120000, 
        exempt: true, 
        branchId: mainBranch.id 
      }
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

  } catch (err: any) {
    console.error('[database error]:', err.message);
  }
};

const server = app.listen(port, () => {
  console.log(`[server]: API running at http://localhost:${port}`);
  bootstrapHostingerDatabase();
});
