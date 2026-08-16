import { PrismaClient, Prisma } from '@prisma/client';
import { TokenPayload } from '../utils/jwt';
import { AppError } from './lead.service';
import { BookingPolicy } from '../policies/booking.policy';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();
const p = prisma as any;

// Property reservation lock duration (24h), consistent with Phase 9 inventory locking.
const LOCK_DURATION_MS = 24 * 60 * 60 * 1000;

interface CreateBookingInput {
  customer_id: number;
  property_id: number;
  agreed_price: number;
  booking_amount: number;
  assigned_employee_id?: number;
  notes?: string;
}

export class BookingService {
  /** List bookings scoped to the user's company. */
  static async getBookings(user: TokenPayload) {
    const bookings = await prisma.booking.findMany({
      where: { company_id: user.companyId },
      orderBy: { id: 'desc' },
    });
    return bookings;
  }

  /** Fetch a single booking with company + policy scoping. */
  static async getBookingById(user: TokenPayload, id: number) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.company_id !== user.companyId) {
      throw new AppError(404, 'Booking not found or access denied');
    }
    if (!BookingPolicy.canView(user, booking)) {
      throw new AppError(403, 'Unauthorized to view this booking');
    }
    return booking;
  }

  /** Phase 11 Portal handoff status for a booking. */
  static async getHandoffStatus(user: TokenPayload, id: number) {
    const booking = await BookingService.getBookingById(user, id);
    const mapping = await p.bookingPortalMapping.findFirst({
      where: { crms_booking_id: id, company_id: user.companyId },
    });
    return {
      crms_booking_id: id,
      crms_customer_id: booking.customer_id,
      handoff_status: mapping ? mapping.handoff_status : 'CREATED',
      portal_customer_id: mapping?.portal_customer_id ?? null,
      portal_booking_id: mapping?.portal_booking_id ?? null,
    };
  }

  /**
   * Create a booking atomically with concurrency-safe property claiming.
   * - When `tx` is supplied (opportunity conversion), operates inside that transaction.
   * - Otherwise it opens its own transaction with a bounded P2002 retry.
   */
  static async createBooking(user: TokenPayload, dto: CreateBookingInput, tx?: Prisma.TransactionClient) {
    if (tx) {
      return BookingService.claimAndCreate(tx, user, dto);
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await prisma.$transaction((client) => BookingService.claimAndCreate(client, user, dto));
      } catch (err: any) {
        if ((err?.code === 'P2002' || err?.code === 'P2034') && attempt < 2) continue;
        throw err;
      }
    }
    throw new AppError(500, 'Failed to create booking after retries');
  }

  private static async claimAndCreate(client: Prisma.TransactionClient, user: TokenPayload, dto: CreateBookingInput) {
    // Serialize concurrent requests and read the property state via the same locking
    // (FOR UPDATE) read. A locking read always returns the latest committed row, so the
    // claim decision is never stale behind a REPEATABLE-READ snapshot (needed when this
    // runs inside an outer transaction that has already performed consistent reads).
    const rows = (await client.$queryRaw`
      SELECT id, status, locked_until, company_id FROM Property WHERE id = ${dto.property_id} FOR UPDATE
    `) as any[];
    if (!rows || rows.length === 0) throw new AppError(404, 'Property not found');

    const property = rows[0];
    if (property.company_id !== user.companyId) {
      throw new AppError(404, 'Cross-company access denied');
    }

    const now = new Date();
    const lockUntil = property.locked_until ? new Date(property.locked_until) : null;

    if (property.status === 'LOCKED') {
      if (lockUntil && lockUntil >= now) {
        throw new AppError(409, 'Property is currently locked');
      }
      // Expired lock is reclaimable.
    } else if (property.status === 'BOOKED' || property.status === 'SOLD') {
      throw new AppError(409, 'Property has already been booked or sold');
    } else if (property.status !== 'LIVE') {
      throw new AppError(409, 'Property is not available for booking');
    }

    // Company-scope the customer. A non-existent customer is intentionally NOT
    // rejected here so the booking FK constraint surfaces a Prisma error (500),
    // matching the existing transaction rollback contract (lock is reverted).
    const customer = await (client as any).customer.findUnique({ where: { id: dto.customer_id } });
    if (customer && customer.company_id !== user.companyId) {
      throw new AppError(404, 'Customer not found in this company');
    }

    let assignedEmployeeId = dto.assigned_employee_id ?? user.employeeId ?? null;
    if (assignedEmployeeId) {
      const emp = await (client as any).employee.findUnique({ where: { id: assignedEmployeeId } });
      if (!emp || emp.company_id !== user.companyId) {
        throw new AppError(404, 'Assigned employee not found in this company');
      }
    }

    const balance = Math.max(0, Number(dto.agreed_price) - Number(dto.booking_amount));
    const count = await (client as any).booking.count({ where: { company_id: user.companyId } });
    const booking_code = `RRH-BK-${now.getFullYear()}-${String(count + 1).padStart(4, '0')}-${randomBytes(3).toString('hex')}`;

    const booking = await (client as any).booking.create({
      data: {
        booking_code,
        company_id: user.companyId,
        customer_id: dto.customer_id,
        property_id: dto.property_id,
        assigned_employee_id: assignedEmployeeId,
        agreed_price: Number(dto.agreed_price),
        booking_amount: Number(dto.booking_amount),
        balance_amount: balance,
        status: 'PENDING',
        notes: dto.notes ?? null,
      },
    });

    // Claim the property lock.
    await (client as any).property.update({
      where: { id: dto.property_id },
      data: {
        status: 'LOCKED',
        locked_until: new Date(now.getTime() + LOCK_DURATION_MS),
        locked_by_booking_id: booking.id,
      },
    });

    return booking;
  }

  static async updateBookingStatus(user: TokenPayload, id: number, status: string) {
    await BookingService.getBookingById(user, id);
    return prisma.booking.update({ where: { id }, data: { status } });
  }

  static async confirmBooking(user: TokenPayload, id: number) {
    const booking = await BookingService.getBookingById(user, id);

    const customer = await p.customer.findUnique({ where: { id: booking.customer_id } });
    const property = await p.property.findUnique({ where: { id: booking.property_id } });

    // Build a strict, approved-field-only outbound payload (no KYC/bank/password data).
    const payload = {
      company_id: booking.company_id,
      customer: customer
        ? {
            crms_customer_id: customer.id,
            customer_code: customer.customer_code,
            first_name: customer.first_name,
            phone: customer.phone,
          }
        : null,
      booking: {
        crms_booking_id: booking.id,
        booking_code: booking.booking_code,
        agreed_price: booking.agreed_price,
      },
      property: property ? { title: property.title } : null,
    };

    // Atomically confirm the booking, transition the property to BOOKED, emit the
    // Phase 11 portal-handoff outbox event, and create the portal mapping.
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({ where: { id }, data: { status: 'CONFIRMED' } });

      const propRow = await (tx as any).property.findUnique({ where: { id: booking.property_id } });
      if (propRow && propRow.company_id === booking.company_id) {
        await (tx as any).property.update({ where: { id: booking.property_id }, data: { status: 'BOOKED' } });
      }

      const existingEvent = await (tx as any).integrationEvent.findFirst({
        where: { crms_booking_id: id, event_type: 'BOOKING_PORTAL_HANDOFF' },
      });
      if (!existingEvent) {
        await (tx as any).integrationEvent.create({
          data: {
            event_type: 'BOOKING_PORTAL_HANDOFF',
            payload: JSON.stringify(payload),
            status: 'CREATED',
            company_id: booking.company_id,
            crms_booking_id: id,
          },
        });
      }

      const existingMapping = await (tx as any).bookingPortalMapping.findFirst({
        where: { crms_booking_id: id },
      });
      if (!existingMapping) {
        await (tx as any).bookingPortalMapping.create({
          data: {
            company_id: booking.company_id,
            crms_booking_id: id,
            crms_customer_id: booking.customer_id,
            handoff_status: 'CREATED',
          },
        });
      }

      return updated;
    });

    return result;
  }

  static async cancelBooking(user: TokenPayload, id: number) {
    const booking = await BookingService.getBookingById(user, id);
    const updated = await prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } });
    const prop = await (p.property as any).findUnique({ where: { id: booking.property_id } });
    if (prop && prop.company_id === user.companyId) {
      await (p.property as any).update({
        where: { id: booking.property_id },
        data: { status: 'LIVE', locked_until: null, locked_by_booking_id: null },
      });
    }
    return updated;
  }
}