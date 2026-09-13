import { Customer, CustomerAuthProvider, SessionWithCustomer } from '@/types/auth';
import { prisma } from '@/lib/db/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { emailProvider } from '@/lib/email/provider';
import { SESSION_DEFAULT_TTL_MS } from './session-core';

export class DbCustomerAuthProvider implements CustomerAuthProvider {
  private mapCustomer(dbCustomer: any): Customer {
    return {
      id: dbCustomer.id,
      firstName: dbCustomer.firstName,
      displayName: dbCustomer.lastName
        ? `${dbCustomer.firstName} ${dbCustomer.lastName}`
        : dbCustomer.firstName,
      email: dbCustomer.email,
      phone: dbCustomer.phone,
      emailVerified: dbCustomer.emailVerifiedAt !== null,
      phoneVerified: false,
      status: 'ACTIVE',
      sellerStatus: dbCustomer.sellerStatus as any,
      createdAt: dbCustomer.createdAt.toISOString(),
      updatedAt: dbCustomer.updatedAt.toISOString(),
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ token: string; session: SessionWithCustomer }> {
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) throw new Error('Invalid credentials');

    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    });

    return this.createSession(customer.id);
  }

  async register(data: {
    firstName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<Customer> {
    const existing = await prisma.customer.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const customer = await prisma.customer.create({
      data: {
        firstName: data.firstName,
        email: data.email,
        phone: data.phone || null,
        passwordHash,
      },
    });

    // Generate Verification Token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await prisma.emailVerificationToken.create({
      data: {
        customerId: customer.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // We assume the caller handles domain forming. For local dev:
    const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
    await emailProvider.sendVerificationEmail({
      email: customer.email,
      name: customer.firstName,
      verificationUrl,
    });

    return this.mapCustomer(customer);
  }

  async logout(token: string): Promise<void> {
    const sessionTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await prisma.session.updateMany({
      where: { sessionTokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyEmail(token: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!verificationToken) return false;
    if (verificationToken.usedAt) return false;
    if (verificationToken.expiresAt < new Date()) return false;

    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.customer.update({
        where: { id: verificationToken.customerId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    return true;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) return; // Silent failure for security

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await prisma.passwordResetToken.create({
      data: {
        customerId: customer.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      },
    });

    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    await emailProvider.sendPasswordResetEmail({
      email: customer.email,
      name: customer.firstName,
      resetUrl,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken) return false;
    if (resetToken.usedAt) return false;
    if (resetToken.expiresAt < new Date()) return false;

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.customer.update({
        where: { id: resetToken.customerId },
        data: { passwordHash },
      }),
    ]);

    // Revoke all sessions for security
    await this.revokeAllSessionsForCustomer(resetToken.customerId);

    return true;
  }

  async getSessionByToken(token: string): Promise<SessionWithCustomer | null> {
    const sessionTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const dbSession = await prisma.session.findUnique({
      where: { sessionTokenHash },
      include: { customer: true },
    });

    if (!dbSession) return null;
    if (dbSession.revokedAt) return null;
    if (dbSession.expiresAt < new Date()) return null;

    return {
      id: token, // Return raw token as ID for the interface requirement
      customerId: dbSession.customerId,
      createdAt: dbSession.createdAt.getTime(),
      expiresAt: dbSession.expiresAt.getTime(),
      revokedAt: null,
      customer: this.mapCustomer(dbSession.customer),
    };
  }

  async createSession(
    customerId: number | string,
    ttlMs?: number
  ): Promise<{ token: string; session: SessionWithCustomer }> {
    const id = typeof customerId === 'string' ? parseInt(customerId, 10) : customerId;
    const token = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + (ttlMs || SESSION_DEFAULT_TTL_MS));

    const dbSession = await prisma.session.create({
      data: {
        customerId: id,
        sessionTokenHash,
        expiresAt,
      },
      include: { customer: true },
    });

    const session: SessionWithCustomer = {
      id: token, // the unhashed token
      customerId: id,
      createdAt: dbSession.createdAt.getTime(),
      expiresAt: dbSession.expiresAt.getTime(),
      revokedAt: null,
      customer: this.mapCustomer(dbSession.customer),
    };

    return { token, session };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.logout(sessionId);
  }

  async revokeAllSessionsForCustomer(customerId: number | string): Promise<void> {
    const id = typeof customerId === 'string' ? parseInt(customerId, 10) : customerId;
    await prisma.session.updateMany({
      where: { customerId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
