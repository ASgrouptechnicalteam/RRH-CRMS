import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { Roles, DepartmentCodes } from '@rrh-ems/shared';
import { notifyEmployee } from '../utils/notifyEmployee';

const router = Router();
const prisma = new PrismaClient();

// Helper to seed and update full employee roster across departments
const ensureFullTeamSeeded = async (companyId: number, branchId: number | null) => {
  const passwordHash = await bcrypt.hash('Password@123', 12);
  const effectiveBranchId = branchId || 1;
  const teamDef = [
    { code: 'RRH-EX-001', role: Roles.MD, name: 'Radha Krishna (MD)', dept: 'Executive', title: 'Managing Director', salary: 150000, exempt: true },
    { code: 'RRH-EX-002', role: Roles.ADMIN, name: 'System Technical Admin', dept: 'IT Systems', title: 'Technical Administrator', salary: 120000, exempt: true },
    { code: 'RRH-HR-001', role: Roles.HR_MANAGER, name: 'Sunitha Varma (HR)', dept: 'Human Resources', title: 'HR Manager', salary: 75000, exempt: true },
    { code: 'RRH-SL-001', role: Roles.TELECALLER, name: 'Praveen Kumar', dept: 'Sales & Leads', title: 'Senior Telecaller Lead', salary: 35000, exempt: false },
    { code: 'RRH-SL-002', role: Roles.TELECALLER, name: 'Anusha Reddy', dept: 'Sales & Leads', title: 'Lead Qualification Agent', salary: 32000, exempt: false },
    { code: 'RRH-MK-001', role: Roles.DIGITAL_LEAD_OPERATOR, name: 'Karthik Rao', dept: 'Marketing', title: 'Digital Marketing Operator', salary: 45000, exempt: false },
    { code: 'RRH-MK-002', role: Roles.CHANNEL_PARTNER_MANAGER, name: 'Vikram Sharma', dept: 'Marketing', title: 'Channel Partner Manager', salary: 55000, exempt: false },
    { code: 'RRH-OP-001', role: Roles.PROJECT_MANAGER, name: 'Srinivas Raju', dept: 'Operations', title: 'Site Project Director', salary: 65000, exempt: false },
    { code: 'RRH-FN-001', role: Roles.FINANCE, name: 'Meenakshi Iyer', dept: 'Finance', title: 'Senior Accounts Manager', salary: 60000, exempt: false },
  ];

  for (const item of teamDef) {
    const role = await prisma.role.findUnique({ where: { name: item.role } });
    if (!role) continue;

    const existing = await prisma.employee.findUnique({
      where: { employee_code: item.code },
      include: { roles: true },
    });

    if (!existing) {
      await prisma.employee.create({
        data: {
          employee_code: item.code,
          full_name: item.name,
          company_id: companyId,
          branch_id: effectiveBranchId,
          password_hash: passwordHash,
          status: 'ACTIVE',
          attendance_required: !item.exempt,
          first_login_done: true,
          job_title: item.title,
          department: item.dept,
          employment_type: 'FULL_TIME',
          salary_ctc: item.salary,
          phone: item.code === 'RRH-EX-001' ? '+91 99887 76655' : '+91 98765 43210',
          email: `${item.code.toLowerCase()}@radharealhomes.com`,
          roles: {
            create: { role_id: role.id },
          },
        },
      });
    } else {
      // Ensure existing MD & HR records have full names, titles, and departments populated!
      await prisma.employee.update({
        where: { id: existing.id },
        data: {
          full_name: existing.full_name || item.name,
          job_title: existing.job_title || item.title,
          department: existing.department || item.dept,
          phone: existing.phone || (item.code === 'RRH-EX-001' ? '+91 99887 76655' : '+91 98765 43210'),
          email: existing.email || `${item.code.toLowerCase()}@radharealhomes.com`,
          salary_ctc: existing.salary_ctc || item.salary,
          attendance_required: !item.exempt,
        },
      });
    }
  }
};

// GET /api/v1/employees - List all active/inactive employees (Admin invisible filtered)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = req.user!.roles;
    if (!roles.includes(Roles.MD) && !roles.includes(Roles.HR_MANAGER) && !roles.includes(Roles.ADMIN) && !roles.includes(Roles.MARKETING_DIRECTOR)) {
      return res.status(403).json({ error: 'Access denied: HR / Management privileges required' });
    }

    // Always run team sync to ensure MD and HR are fully populated with industrial details
    await ensureFullTeamSeeded(req.user!.companyId, req.user!.branchId);

    const employees = await prisma.employee.findMany({
      where: {
        roles: {
          none: {
            role: { is_invisible: true },
          },
        },
      },
      include: {
        branch: true,
        roles: { include: { role: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = employees.map((emp) => ({
      id: emp.id,
      employeeCode: emp.employee_code,
      fullName: emp.full_name || (emp.employee_code === 'RRH-EX-001' ? 'Radha Krishna (MD)' : emp.employee_code === 'RRH-HR-001' ? 'Sunitha Varma (HR)' : emp.employee_code),
      branchId: emp.branch_id,
      branch: emp.branch?.name || 'All Branches',
      status: emp.status,
      attendanceRequired: emp.attendance_required,
      firstLoginDone: emp.first_login_done,
      roles: emp.roles.map((r) => r.role.name),
      createdAt: emp.created_at,

      // Industrial Details
      phone: emp.phone || '+91 98765 43210',
      secondaryPhone: emp.secondary_phone || '',
      whatsappNumber: emp.whatsapp_number || '',
      email: emp.email || `${emp.employee_code.toLowerCase()}@radharealhomes.com`,
      bloodGroup: emp.blood_group || 'O+',
      socialLinks: emp.social_links || '',
      currentAddress: emp.current_address || 'Hyderabad, Telangana',
      permanentAddress: emp.permanent_address || 'Hyderabad, Telangana',
      emergencyContactName: emp.emergency_contact_name || 'Emergency Support',
      emergencyContactRelation: emp.emergency_contact_relation || 'Family',
      emergencyContactPhone: emp.emergency_contact_phone || '+91 99887 76655',
      panNumber: emp.pan_number || 'ABCDE1234F',
      aadhaarNumber: emp.aadhaar_number || '1234 5678 9012',
      bankName: emp.bank_name || 'HDFC Bank',
      bankAccountNumber: emp.bank_account_number || '50100234567890',
      bankIfsc: emp.bank_ifsc || 'HDFC0001234',
      bankBranch: emp.bank_branch || 'Miyapur Branch',
      jobTitle: emp.job_title || (emp.roles[0]?.role.name === 'MD' ? 'Managing Director' : emp.roles[0]?.role.name === 'HR Manager' ? 'HR Manager' : 'Staff Member'),
      department: emp.department || (emp.roles[0]?.role.name === 'MD' ? 'Executive' : emp.roles[0]?.role.name === 'HR Manager' ? 'Human Resources' : 'Operations'),
      employmentType: emp.employment_type || 'FULL_TIME',
      reportingManagerId: emp.reporting_manager_id,
      dateOfJoining: emp.date_of_joining ? emp.date_of_joining.toISOString().split('T')[0] : '2026-01-01',
      salaryCtc: emp.salary_ctc || 35000,
      backgroundEducation: emp.background_education || 'Graduate',
    }));

    return res.status(200).json({ employees: formatted });
  } catch (error) {
    console.error('Fetch employees error:', error);
    return res.status(500).json({ error: 'Failed to fetch employees list' });
  }
});

// GET /api/v1/employees/branches - Get all branches for dropdown
router.get('/branches', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { company_id: req.user!.companyId },
    });
    return res.status(200).json({ branches });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// GET /api/v1/employees/managers - Get list of reporting managers
router.get('/managers', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const managers = await prisma.employee.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: { in: [Roles.MD, Roles.HR_MANAGER, Roles.PROJECT_MANAGER, Roles.MARKETING_DIRECTOR] },
            },
          },
        },
      },
      select: {
        id: true,
        employee_code: true,
        full_name: true,
        job_title: true,
      },
    });

    const formatted = managers.map((m) => ({
      id: m.id,
      label: `${m.full_name || m.employee_code} (${m.job_title || 'Manager'}) - ${m.employee_code}`,
    }));

    return res.status(200).json({ managers: formatted });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch managers' });
  }
});

// POST /api/v1/employees - Add new employee with all 20 industrial fields
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = req.user!.roles;
    if (!roles.includes(Roles.MD) && !roles.includes(Roles.HR_MANAGER) && !roles.includes(Roles.ADMIN)) {
      return res.status(403).json({ error: 'Access denied: HR / Management privileges required' });
    }

    const {
      full_name,
      phone,
      secondary_phone,
      whatsapp_number,
      email,
      blood_group,
      social_links,
      current_address,
      permanent_address,
      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,
      pan_number,
      aadhaar_number,
      bank_name,
      bank_account_number,
      bank_ifsc,
      bank_branch,
      job_title,
      department,
      employment_type,
      reporting_manager_id,
      date_of_joining,
      salary_ctc,
      background_education,
      role_name,
      branch_id,
      initial_password,
    } = req.body;

    if (!role_name || !branch_id || !full_name || !phone) {
      return res.status(400).json({ error: 'Full Name, Primary Phone, Role, and Branch are required fields' });
    }

    const deptCode = DepartmentCodes[role_name] || 'EX';

    const count = await prisma.employee.count();
    const nextSeq = String(count + 1).padStart(3, '0');
    const employeeCode = `RRH-${deptCode}-${nextSeq}`;

    const role = await prisma.role.findUnique({
      where: { name: role_name },
    });

    if (!role) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const passwordHash = await bcrypt.hash(initial_password || 'Password@123', 12);
    const isExempt = [Roles.MD, Roles.HR_MANAGER, Roles.ADMIN, Roles.MARKETING_DIRECTOR].includes(role_name as any);

    const newEmp = await prisma.employee.create({
      data: {
        employee_code: employeeCode,
        full_name,
        phone,
        secondary_phone,
        whatsapp_number: whatsapp_number || phone,
        email,
        blood_group: blood_group || 'O+',
        social_links,
        current_address,
        permanent_address: permanent_address || current_address,
        emergency_contact_name,
        emergency_contact_relation,
        emergency_contact_phone,
        pan_number,
        aadhaar_number,
        bank_name,
        bank_account_number,
        bank_ifsc,
        bank_branch,
        job_title: job_title || role_name,
        department: department || 'Operations',
        employment_type: employment_type || 'FULL_TIME',
        reporting_manager_id: reporting_manager_id ? parseInt(reporting_manager_id, 10) : null,
        date_of_joining: date_of_joining ? new Date(date_of_joining) : new Date(),
        salary_ctc: salary_ctc ? parseFloat(salary_ctc) : 35000,
        background_education,
        company_id: req.user!.companyId,
        branch_id: parseInt(branch_id, 10),
        password_hash: passwordHash,
        status: 'ACTIVE',
        attendance_required: !isExempt,
        first_login_done: true,
        roles: {
          create: {
            role_id: role.id,
          },
        },
      },
      include: {
        branch: true,
        roles: { include: { role: true } },
      },
    });

    return res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        id: newEmp.id,
        employeeCode: newEmp.employee_code,
        fullName: newEmp.full_name,
        branch: newEmp.branch?.name || 'All Branches',
        status: newEmp.status,
        attendanceRequired: newEmp.attendance_required,
        roles: newEmp.roles.map((r) => r.role.name),
        defaultPassword: initial_password || 'Password@123',
      },
    });
  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PATCH /api/v1/employees/:id - Update employee status, branch, roles or any profile detail
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = req.user!.roles;
    if (!roles.includes(Roles.MD) && !roles.includes(Roles.HR_MANAGER) && !roles.includes(Roles.ADMIN)) {
      return res.status(403).json({ error: 'Access denied: HR / Management privileges required' });
    }

    const employeeId = parseInt(req.params.id, 10);
    const body = req.body;

    const updateData: any = {};
    if (body.full_name !== undefined) updateData.full_name = body.full_name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.secondary_phone !== undefined) updateData.secondary_phone = body.secondary_phone;
    if (body.whatsapp_number !== undefined) updateData.whatsapp_number = body.whatsapp_number;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.blood_group !== undefined) updateData.blood_group = body.blood_group;
    if (body.social_links !== undefined) updateData.social_links = body.social_links;
    if (body.current_address !== undefined) updateData.current_address = body.current_address;
    if (body.permanent_address !== undefined) updateData.permanent_address = body.permanent_address;
    if (body.emergency_contact_name !== undefined) updateData.emergency_contact_name = body.emergency_contact_name;
    if (body.emergency_contact_relation !== undefined) updateData.emergency_contact_relation = body.emergency_contact_relation;
    if (body.emergency_contact_phone !== undefined) updateData.emergency_contact_phone = body.emergency_contact_phone;
    if (body.pan_number !== undefined) updateData.pan_number = body.pan_number;
    if (body.aadhaar_number !== undefined) updateData.aadhaar_number = body.aadhaar_number;
    if (body.bank_name !== undefined) updateData.bank_name = body.bank_name;
    if (body.bank_account_number !== undefined) updateData.bank_account_number = body.bank_account_number;
    if (body.bank_ifsc !== undefined) updateData.bank_ifsc = body.bank_ifsc;
    if (body.bank_branch !== undefined) updateData.bank_branch = body.bank_branch;
    if (body.job_title !== undefined) updateData.job_title = body.job_title;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.employment_type !== undefined) updateData.employment_type = body.employment_type;
    if (body.reporting_manager_id !== undefined) updateData.reporting_manager_id = body.reporting_manager_id ? parseInt(body.reporting_manager_id, 10) : null;
    if (body.date_of_joining !== undefined) updateData.date_of_joining = new Date(body.date_of_joining);
    if (body.salary_ctc !== undefined) updateData.salary_ctc = parseFloat(body.salary_ctc);
    if (body.background_education !== undefined) updateData.background_education = body.background_education;
    if (body.branch_id !== undefined) updateData.branch_id = parseInt(body.branch_id, 10);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.attendance_required !== undefined) updateData.attendance_required = Boolean(body.attendance_required);

    if (body.role_name) {
      const targetRole = await prisma.role.findUnique({ where: { name: body.role_name } });
      if (targetRole) {
        await prisma.employeeRole.deleteMany({ where: { employee_id: employeeId } });
        await prisma.employeeRole.create({
          data: {
            employee_id: employeeId,
            role_id: targetRole.id,
          },
        });
      }
    }

    const updatedEmp = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
      include: {
        branch: true,
        roles: { include: { role: true } },
      },
    });

    // ── Universal Notifications ──────────────────────────────────
    // Notify the employee for every significant profile change
    const notifyPromises: Promise<void>[] = [];

    if (body.salary_ctc !== undefined) {
      notifyPromises.push(notifyEmployee(employeeId, {
        type: 'SALARY_CHANGED',
        title: '💰 Your Salary Has Been Updated',
        message: `Your monthly CTC has been updated to ₹${parseFloat(body.salary_ctc).toLocaleString('en-IN')}. Please contact HR for any queries.`,
      }));
    }

    if (body.role_name) {
      notifyPromises.push(notifyEmployee(employeeId, {
        type: 'ROLE_CHANGED',
        title: '🏷️ Your Role Has Been Updated',
        message: `Your position has been updated to "${body.role_name}". Please check with your manager for next steps.`,
      }));
    }

    if (body.status !== undefined) {
      const statusMessages: Record<string, string> = {
        ACTIVE:    '✅ Your account has been activated.',
        INACTIVE:  '⚠️ Your account has been deactivated. Contact HR for details.',
        SUSPENDED: '🚫 Your account has been suspended. Contact HR immediately.',
      };
      const msg = statusMessages[body.status] || `Your account status was changed to ${body.status}.`;
      notifyPromises.push(notifyEmployee(employeeId, {
        type: 'STATUS_CHANGED',
        title: '🔔 Account Status Changed',
        message: msg,
      }));
    }

    if (body.branch_id !== undefined) {
      notifyPromises.push(notifyEmployee(employeeId, {
        type: 'BRANCH_CHANGED',
        title: '🏢 Your Branch/Department Has Changed',
        message: `You have been transferred to a new branch/department. Please check with HR for your reporting details.`,
      }));
    }

    if (body.job_title !== undefined) {
      notifyPromises.push(notifyEmployee(employeeId, {
        type: 'JOB_TITLE_CHANGED',
        title: '💼 Your Job Title Has Been Updated',
        message: `Your job title has been updated to "${body.job_title}".`,
      }));
    }

    await Promise.allSettled(notifyPromises);
    // ─────────────────────────────────────────────────────────────

    return res.status(200).json({
      message: 'Employee details updated successfully',
      employee: updatedEmp,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update employee' });
  }
});

// POST /api/v1/employees/:id/reset-password - Admin 1-click Password Reset
router.post('/:id/reset-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = req.user!.roles;
    if (!roles.includes(Roles.MD) && !roles.includes(Roles.HR_MANAGER) && !roles.includes(Roles.ADMIN)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const employeeId = parseInt(req.params.id, 10);
    const newHash = await bcrypt.hash('Password@123', 12);

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        password_hash: newHash,
        first_login_done: true,
      },
    });

    // Notify employee their password was reset by admin
    await notifyEmployee(employeeId, {
      type: 'PASSWORD_RESET',
      title: '🔐 Your Password Has Been Reset',
      message: 'An administrator has reset your password to the default. Please log in and change it immediately.',
    });

    return res.status(200).json({
      message: 'Password reset to default (Password@123) successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reset employee password' });
  }
});

export default router;
