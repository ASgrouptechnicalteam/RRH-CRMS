import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { LoginSchema, ChangePasswordSchema, Roles } from '@rrh-ems/shared';
import { validateRequestBody } from '../middleware/validate';

const router = Router();
const prisma = new PrismaClient();
const p = prisma as any;

// Helper to auto-seed Hostinger MySQL DB if empty on login attempt
const autoSeedHostinger = async () => {
  try {
    const empCount = await p.employee.count();
    if (empCount > 0) return;

    console.log('🌱 Empty Hostinger Database Detected! Auto-seeding Full Enterprise Team...');

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

    console.log('🎉 Hostinger MySQL Database Auto-Seeded Successfully on First Login!');
  } catch (err: any) {
    console.error('Auto seed error:', err);
  }
};

// POST /api/v1/auth/login
router.post('/login', validateRequestBody(LoginSchema), async (req, res: Response) => {
  try {
    // Auto-seed Hostinger database if empty before processing login
    await autoSeedHostinger();

    const { employee_code, password } = req.body;

    // Find active employee by employee_code
    const employee = await p.employee.findUnique({
      where: { employee_code },
      include: {
        company: true,
        branch: true,
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } }
            },
          },
        },
        permission_overrides: { include: { permission: true } },
      },
    });

    if (!employee || employee.status !== 'ACTIVE') {
      await p.auditEvent.create({
        data: {
          actor_id: 0,
          action: 'SECURITY_ALERT',
          entity_type: 'AUTH_FAILED',
          entity_id: 0,
          new_value: `Attempted login with invalid/inactive code: ${employee_code}`
        }
      });
      return res.status(401).json({ error: 'Invalid employee ID or account inactive' });
    }

    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch) {
      await p.auditEvent.create({
        data: {
          actor_id: employee.id,
          action: 'SECURITY_ALERT',
          entity_type: 'AUTH_FAILED',
          entity_id: employee.id,
          new_value: `Invalid password attempt for ${employee_code}`
        }
      });
      return res.status(401).json({ error: 'Invalid password' });
    }

    const roleNames = employee.roles.map((r: any) => r.role.name);
    const permissionsSet = new Set<string>();
    employee.roles.forEach((r: any) => {
      if (r.role.permissions) {
        r.role.permissions.forEach((rp: any) => permissionsSet.add(rp.permission.name));
      }
    });
    if (employee.permission_overrides) {
      employee.permission_overrides.forEach((po: any) => {
        if (po.is_granted) permissionsSet.add(po.permission.name);
        else permissionsSet.delete(po.permission.name);
      });
    }
    const permissions = Array.from(permissionsSet);

    const tokenPayload = {
      employeeId: employee.id,
      employeeCode: employee.employee_code,
      companyId: employee.company_id,
      branchId: employee.branch_id,
      roles: roleNames,
      permissions,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Set httpOnly refresh cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      firstLoginDone: employee.first_login_done,
      attendanceRequired: employee.attendance_required,
      user: {
        id: employee.id,
        employeeCode: employee.employee_code,
        fullName: employee.full_name,
        department: employee.department,
        company: employee.company.name,
        branch: employee.branch?.name || 'All Branches',
        roles: roleNames,
        permissions,
        attendanceRequired: employee.attendance_required,
        firstLoginDone: employee.first_login_done,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// POST /api/v1/auth/change-password
router.post(
  '/change-password',
  authenticateToken,
  validateRequestBody(ChangePasswordSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { current_password, new_password } = req.body;
      const employeeId = req.user!.employeeId;

      const employee = await p.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const match = await bcrypt.compare(current_password, employee.password_hash);
      if (!match) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const newHash = await bcrypt.hash(new_password, 12);

      await p.employee.update({
        where: { id: employeeId },
        data: {
          password_hash: newHash,
          first_login_done: true,
        },
      });

      return res.status(200).json({
        message: 'Password updated successfully',
        firstLoginDone: true,
      });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ error: 'Failed to update password' });
    }
  }
);

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employee = await p.employee.findUnique({
      where: { id: req.user!.employeeId },
      include: {
        company: true,
        branch: true,
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        permission_overrides: { include: { permission: true } },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const roleNames = employee.roles.map((r: any) => r.role.name);
    const permissionsSet = new Set<string>();
    employee.roles.forEach((r: any) => {
      if (r.role.permissions) {
        r.role.permissions.forEach((rp: any) => permissionsSet.add(rp.permission.name));
      }
    });
    if (employee.permission_overrides) {
      employee.permission_overrides.forEach((po: any) => {
        if (po.is_granted) permissionsSet.add(po.permission.name);
        else permissionsSet.delete(po.permission.name);
      });
    }
    const permissions = Array.from(permissionsSet);

    return res.status(200).json({
      user: {
        id: employee.id,
        employeeCode: employee.employee_code,
        fullName: employee.full_name,
        company: employee.company.name,
        branch: employee.branch?.name || 'All Branches',
        department: employee.department,
        roles: roleNames,
        permissions,
        attendanceRequired: employee.attendance_required,
        firstLoginDone: employee.first_login_done,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res: Response) => {
  res.clearCookie('refreshToken');
  return res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
