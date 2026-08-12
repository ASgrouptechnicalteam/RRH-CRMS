import { PrismaClient, Payment } from '@prisma/client';
import { TokenPayload } from '../utils/jwt';
import { PaymentPolicy } from '../policies/payment.policy';
import { BookingPolicy } from '../policies/booking.policy';

const prisma = new PrismaClient();
const p = prisma as any;

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class PaymentService {
  private static async generateNextPaymentCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await p.payment.count();
    const sequentialNum = (count + 1).toString().padStart(5, '0');
    return `RRH-PAY-${currentYear}-${sequentialNum}`;
  }

  static async getPayments(user: TokenPayload, bookingId?: number) {
    const whereCondition: any = { company_id: user.companyId };
    
    if (bookingId) {
      whereCondition.booking_id = bookingId;
    }

    // Similar scope restrictions could be applied here if an agent queries all payments
    const isManagement = user.roles.some((r: any) =>
      ['Managing director', 'Admin (Technical)', 'HR', 'accountant', 'marketing director', 'Digital lead operator', 'project managers'].includes(r)
    );

    if (!isManagement) {
      whereCondition.recorded_by_id = user.employeeId;
    }

    return await p.payment.findMany({
      where: whereCondition,
      include: {
        booking: { select: { booking_code: true, customer: { select: { first_name: true, last_name: true } } } },
        recorded_by: { select: { id: true, full_name: true } }
      },
      orderBy: { payment_date: 'desc' }
    });
  }

  static async recordPayment(user: TokenPayload, dto: any) {
    // Validate booking exists and is accessible
    const booking = await p.booking.findFirst({
      where: { id: dto.booking_id, company_id: user.companyId }
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (!BookingPolicy.canView(user, booking)) {
      throw new AppError(403, 'You do not have access to record a payment for this booking');
    }

    if (booking.status === 'CANCELLED') {
      throw new AppError(400, 'Cannot record payment for a cancelled booking');
    }

    const paymentCode = await this.generateNextPaymentCode();

    return await p.$transaction(async (tx: any) => {
      const payment = await tx.payment.create({
        data: {
          payment_code: paymentCode,
          company_id: user.companyId,
          booking_id: booking.id,
          amount: dto.amount,
          payment_method: dto.payment_method,
          reference_number: dto.reference_number,
          notes: dto.notes,
          status: 'PENDING', // All new payments require Finance verification
          recorded_by_id: user.employeeId,
        }
      });

      // Update booking balance assuming payment will be verified? 
      // Strictly, we only reduce balance when status is SUCCESS.
      // For now, we just create the payment record.

      return payment;
    });
  }

  static async verifyPayment(user: TokenPayload, id: number, status: string) {
    const payment = await p.payment.findFirst({
      where: { id, company_id: user.companyId },
      include: { booking: true }
    });

    if (!payment) {
      throw new AppError(404, 'Payment not found');
    }

    if (!PaymentPolicy.canMutate(user, payment)) {
      throw new AppError(403, 'Permission denied');
    }

    if (payment.status === 'SUCCESS') {
      throw new AppError(400, 'Payment is already verified and successful');
    }

    return await p.$transaction(async (tx: any) => {
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: { status }
      });

      if (status === 'SUCCESS') {
        // Reduce the booking balance
        const newBalance = Math.max(0, payment.booking.balance_amount - payment.amount);
        
        await tx.booking.update({
          where: { id: payment.booking.id },
          data: { balance_amount: newBalance }
        });
      }

      return updatedPayment;
    });
  }
}
