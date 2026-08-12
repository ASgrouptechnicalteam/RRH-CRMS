import { PrismaClient, Booking } from '@prisma/client';
import { TokenPayload } from '../utils/jwt';
import { BookingPolicy } from '../policies/booking.policy';

const prisma = new PrismaClient();
const p = prisma as any;

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class BookingService {
  private static async generateNextBookingCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await p.booking.count();
    const sequentialNum = (count + 1).toString().padStart(4, '0');
    return `RRH-BK-${currentYear}-${sequentialNum}`;
  }

  static async getBookings(user: TokenPayload) {
    // For Phase 5, scoping is purely by company, but could be restricted further by ownership
    // Admin/Finance/Management see all company bookings. Agents see their assigned ones.
    const isManagement = user.roles.some((r: any) =>
      ['Managing director', 'Admin (Technical)', 'HR', 'accountant', 'marketing director', 'Digital lead operator', 'project managers'].includes(r)
    );

    const whereCondition: any = { company_id: user.companyId };
    
    if (!isManagement) {
      whereCondition.assigned_employee_id = user.employeeId;
    }

    return await p.booking.findMany({
      where: whereCondition,
      include: {
        customer: { select: { id: true, first_name: true, last_name: true, phone: true } },
        property: { select: { id: true, title: true, status: true } },
        assigned_employee: { select: { id: true, employee_code: true, full_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  static async getBookingById(user: TokenPayload, id: number) {
    const booking = await p.booking.findFirst({
      where: { id, company_id: user.companyId },
      include: {
        customer: true,
        property: true,
        assigned_employee: { select: { id: true, employee_code: true, full_name: true } },
        payments: {
          orderBy: { payment_date: 'desc' },
          include: { recorded_by: { select: { id: true, full_name: true } } }
        },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (!BookingPolicy.canView(user, booking)) {
      throw new AppError(403, 'You do not have permission to view this booking');
    }

    return booking;
  }

  static async createBooking(user: TokenPayload, dto: any) {
    // Verify Property is LIVE and available
    const property = await p.property.findFirst({
      where: { id: dto.property_id, company_id: user.companyId }
    });

    if (!property) {
      throw new AppError(404, 'Property not found');
    }

    if (property.status === 'BOOKED' || property.status === 'SOLD') {
      throw new AppError(409, 'Property is already booked or sold');
    }

    if (property.status !== 'LIVE') {
      throw new AppError(400, 'Property must be LIVE to create a booking');
    }

    const bookingCode = await this.generateNextBookingCode();

    return await p.$transaction(async (tx: any) => {
      const booking = await tx.booking.create({
        data: {
          booking_code: bookingCode,
          company_id: user.companyId,
          branch_id: user.branchId || null,
          customer_id: dto.customer_id,
          property_id: dto.property_id,
          assigned_employee_id: dto.assigned_employee_id || user.employeeId,
          status: 'PENDING',
          agreed_price: dto.agreed_price,
          booking_amount: dto.booking_amount,
          balance_amount: dto.agreed_price, // Initially full amount
          notes: dto.notes,
        },
      });

      // Update property status to BOOKED
      await tx.property.update({
        where: { id: property.id },
        data: { status: 'BOOKED' }
      });

      // Optional: Audit event tracking could go here

      return booking;
    });
  }

  static async updateBookingStatus(user: TokenPayload, id: number, status: string) {
    const booking = await this.getBookingById(user, id);

    if (!BookingPolicy.canMutate(user, booking)) {
      throw new AppError(403, 'Permission denied to update this booking');
    }

    // specific status transition logic can be added here
    if (status === 'CANCELLED') {
      // return property to LIVE
      await p.property.update({
        where: { id: booking.property_id },
        data: { status: 'LIVE' }
      });
    }

    return await p.booking.update({
      where: { id },
      data: { status },
    });
  }
}
