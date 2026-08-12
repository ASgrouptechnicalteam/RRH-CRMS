import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireAuthz } from '../middleware/authz';
import { Permissions } from '@rrh-ems/shared';
import { BookingService } from '../services/booking.service';

const router = Router();

// Zod schemas for validation
const CreateBookingSchema = z.object({
  customer_id: z.number().int().positive(),
  property_id: z.number().int().positive(),
  agreed_price: z.number().positive(),
  booking_amount: z.number().positive(),
  notes: z.string().optional(),
  assigned_employee_id: z.number().int().positive().optional(),
});

const UpdateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']),
});

// Routes
router.use(authenticateToken);

router.get(
  '/',
  requireAuthz(Permissions.BOOKINGS_READ as any),
  async (req: any, res, next) => {
    try {
      const bookings = await BookingService.getBookings(req.user);
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  requireAuthz(Permissions.BOOKINGS_READ as any),
  async (req: any, res, next) => {
    try {
      const booking = await BookingService.getBookingById(req.user, parseInt(req.params.id, 10));
      res.json(booking);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  requireAuthz(Permissions.BOOKINGS_CREATE as any),
  async (req: any, res, next) => {
    try {
      const dto = CreateBookingSchema.parse(req.body);
      const booking = await BookingService.createBooking(req.user, dto);
      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id/status',
  requireAuthz(Permissions.BOOKINGS_CONFIRM as any), // We'll simplify and say CONFIRM permission covers this, or we can check specific status inside service
  async (req: any, res, next) => {
    try {
      const { status } = UpdateBookingStatusSchema.parse(req.body);
      
      // Additional permission check if cancelling
      if (status === 'CANCELLED' && !req.user.permissions.includes(Permissions.BOOKINGS_CANCEL)) {
        return res.status(403).json({ error: 'Permission denied to cancel booking' });
      }

      const booking = await BookingService.updateBookingStatus(req.user, parseInt(req.params.id, 10), status);
      res.json(booking);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
