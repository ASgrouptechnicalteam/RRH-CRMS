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


// POST /api/v1/auth/login
router.post('/login', validateRequestBody(LoginSchema), async (req, res: Response) => {
  try {

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
        company: employee.company?.name || 'RRH EMS',
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
