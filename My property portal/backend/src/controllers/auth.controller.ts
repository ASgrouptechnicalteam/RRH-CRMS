import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { generateToken, JwtPayload } from '../utils/jwt';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const handleFailedLogin = async (identifier: string, ipAddress: string) => {
  const attempt = await prisma.failedLoginAttempt.findUnique({ where: { identifier } });

  if (attempt) {
    const newCount = attempt.count + 1;
    let lockedUntil = null;

    if (newCount >= MAX_FAILED_ATTEMPTS) {
      lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
    }

    await prisma.failedLoginAttempt.update({
      where: { identifier },
      data: { count: newCount, lockedUntil, lastAttempt: new Date() },
    });
  } else {
    await prisma.failedLoginAttempt.create({
      data: { identifier, ipAddress, count: 1 },
    });
  }
};

const resetFailedLogin = async (identifier: string) => {
  await prisma.failedLoginAttempt.deleteMany({ where: { identifier } });
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    // Check failed attempts
    const failedAttempt = await prisma.failedLoginAttempt.findUnique({ where: { identifier } });
    if (failedAttempt && failedAttempt.lockedUntil && failedAttempt.lockedUntil > new Date()) {
      return res
        .status(403)
        .json({
          message:
            'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
        });
    }

    let user = null;
    let userType: 'Customer' | 'Employee' | null = null;
    let role = 'Customer';

    // Check if customer (assumes identifier is phone number)
    const customer = await prisma.customer.findUnique({ where: { phone: identifier } });
    if (customer) {
      user = customer;
      userType = 'Customer';
    } else {
      // Check if employee
      const employee = await prisma.employee.findUnique({
        where: { employeeId: identifier },
        include: { role: true },
      });
      if (employee) {
        user = employee;
        userType = 'Employee';
        role = employee.role.name;
      }
    }

    if (!user || user.status !== 'Active') {
      await handleFailedLogin(identifier, ipAddress);
      return res.status(401).json({ message: 'Invalid credentials or inactive account' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await handleFailedLogin(identifier, ipAddress);

      // Log failure
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          userType: (userType || 'Unknown') as string,
          ipAddress: (ipAddress || '') as string,
          userAgent: (req.headers['user-agent'] as string) || 'unknown',
          status: 'Failed',
        },
      });

      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Success
    await resetFailedLogin(identifier);

    // Log success
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        userType: (userType || 'Unknown') as string,
        ipAddress: (ipAddress || '') as string,
        userAgent: (req.headers['user-agent'] as string) || 'unknown',
        status: 'Success',
      },
    });

    const payload: JwtPayload = { id: user.id, role, type: userType as 'Customer' | 'Employee' };
    const token = generateToken(payload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, role, type: userType },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id;
    const userType = req.user?.type;

    if (!userId || !userType) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let user;
    if (userType === 'Customer') {
      user = await prisma.customer.findUnique({ where: { id: userId } });
    } else {
      user = await prisma.employee.findUnique({ where: { id: userId } });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid old password' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    if (userType === 'Customer') {
      await prisma.customer.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });
    } else {
      await prisma.employee.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        actionType: 'UPDATE',
        entity: userType,
        entityId: userId,
        reason: 'Password change',
      },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { targetUserId, targetUserType, newPassword } = req.body;

    // In a real app, this would be highly restricted.
    // For Phase 2, we assume only an MD or system admin can call this directly via API.
    if (req.user?.role !== 'MD') {
      return res.status(403).json({ message: 'Forbidden: Only MD can reset passwords directly' });
    }

    if (!targetUserId || !targetUserType || !newPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    if (targetUserType === 'Customer') {
      await prisma.customer.update({
        where: { id: targetUserId },
        data: { passwordHash: newPasswordHash },
      });
    } else {
      await prisma.employee.update({
        where: { id: targetUserId },
        data: { passwordHash: newPasswordHash },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actionType: 'UPDATE',
        entity: targetUserType,
        entityId: targetUserId,
        reason: 'Password reset by admin',
      },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
