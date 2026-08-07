import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { Roles } from '@rrh-ems/shared';

const router = Router();
const prisma = new PrismaClient();
const p = prisma as any;

// Code Generator: RRH-SV-YYYY-XXXX
const generateNextBookingCode = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await p.siteVisitBooking.count();
  const seq = (count + 1).toString().padStart(4, '0');
  return `RRH-SV-${currentYear}-${seq}`;
};

// GET /api/v1/site-visits - List site visits (role-aware)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, leadId } = req.query;
    const employeeId = req.user?.employeeId || (req.user as any)?.userId || (req.user as any)?.id || 1;
    const userRoles = req.user?.roles || [];

    const isManagement = userRoles.some((r: string) =>
      [Roles.MD, Roles.ADMIN, Roles.HR_MANAGER, Roles.MARKETING_DIRECTOR, Roles.PROJECT_MANAGER].includes(r as any)
    );

    const whereCondition: any = {};
    if (status && typeof status === 'string') {
      whereCondition.status = status;
    }
    if (leadId) {
      whereCondition.lead_id = parseInt(leadId as string, 10);
    }

    if (!isManagement) {
      // Telecaller or Agent sees visits assigned to them
      whereCondition.OR = [
        { telecaller_id: employeeId },
        { assigned_agent_id: employeeId },
        { project_manager_id: employeeId },
      ];
    }

    const visits = await p.siteVisitBooking.findMany({
      where: whereCondition,
      include: {
        lead: { select: { id: true, lead_code: true, customer_name: true, phone: true, preferred_location: true } },
        telecaller: { select: { id: true, employee_code: true, full_name: true, phone: true } },
        project_manager: { select: { id: true, employee_code: true, full_name: true, phone: true } },
        assigned_agent: { select: { id: true, employee_code: true, full_name: true, phone: true } },
      },
      orderBy: { scheduled_date: 'asc' },
    });

    return res.status(200).json({ visits });
  } catch (error: any) {
    console.error('Fetch site visits error:', error);
    return res.status(500).json({ error: 'Failed to fetch site visit bookings' });
  }
});

// POST /api/v1/site-visits - Telecaller books site visit / demo discussion (Stage 1: PENDING_VERIFICATION)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lead_id, property_id, scheduled_date, notes } = req.body;
    const employeeId = req.user?.employeeId || (req.user as any)?.userId || (req.user as any)?.id || 1;
    const companyId = req.user?.companyId || (req.user as any)?.company_id || 1;

    const lead = await p.lead.findUnique({ where: { id: lead_id } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const bookingCode = await generateNextBookingCode();

    // Auto-assign Project Manager based on Property
    let pmId = null;
    let pm = null;

    if (property_id) {
      const property = await p.property.findUnique({
        where: { id: property_id },
        include: { assigned_pm: true }
      });
      
      if (property?.assigned_pm && property.assigned_pm.status === 'ACTIVE') {
        pmId = property.assigned_pm_id;
        pm = property.assigned_pm;
      }
    }

    if (!pmId) {
      // Fallback: Notify MD
      const md = await p.employee.findFirst({
        where: { roles: { some: { role: { name: Roles.MD } } } }
      });
      if (md) {
        await p.notification.create({
          data: {
            employee_id: md.id,
            type: 'SYSTEM_ALERT',
            title: 'Unassigned Site Visit',
            message: `Site visit for Property ${property_id || 'Unknown'} has no active PM. Please reassign manually.`
          }
        });
      }
    }

    const booking = await p.siteVisitBooking.create({
      data: {
        booking_code: bookingCode,
        lead_id,
        property_id: property_id || null,
        telecaller_id: employeeId,
        project_manager_id: pmId,
        scheduled_date: new Date(scheduled_date),
        status: 'PENDING_VERIFICATION',
        verification_call_notes: notes || 'Booked by telecaller. Awaiting verification call.',
      },
    });

    // Activity log
    await p.leadActivity.create({
      data: {
        lead_id,
        actor_id: employeeId,
        activity_type: 'SITE_VISIT_BOOKED',
        notes: `Site Visit ${booking.booking_code} booked for ${new Date(scheduled_date).toLocaleString()}. Assigned to PM ${pm ? pm.employee_code : 'Queue'}.`,
      },
    });

    return res.status(201).json({
      message: `Site visit ${booking.booking_code} booked! Verification call pending.`,
      booking,
    });
  } catch (error: any) {
    console.error('Book site visit error:', error);
    return res.status(500).json({ error: 'Failed to book site visit' });
  }
});

// POST /api/v1/site-visits/:id/verify - Telecaller calls client to verify & confirm schedule
router.post('/:id/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const visitId = parseInt(req.params.id, 10);
    const { confirmed, verification_notes } = req.body;
    const employeeId = req.user?.employeeId || (req.user as any)?.userId || (req.user as any)?.id || 1;

    const visit = await p.siteVisitBooking.findUnique({ where: { id: visitId } });
    if (!visit) {
      return res.status(404).json({ error: 'Site visit booking not found' });
    }

    const nextStatus = confirmed ? 'CONFIRMED' : 'CANCELLED';

    const updated = await p.siteVisitBooking.update({
      where: { id: visitId },
      data: {
        status: nextStatus,
        verification_call_notes: verification_notes || 'Schedule verified by telecaller call.',
      },
    });

    // Update Lead status to SITE_VISIT_SCHEDULED
    if (confirmed) {
      await p.lead.update({
        where: { id: visit.lead_id },
        data: { status: 'SITE_VISIT_SCHEDULED' },
      });
    }

    await p.leadActivity.create({
      data: {
        lead_id: visit.lead_id,
        actor_id: employeeId,
        activity_type: 'SITE_VISIT_VERIFIED',
        notes: `Telecaller call verified site visit ${visit.booking_code}: ${nextStatus}. Notes: ${verification_notes || 'Confirmed'}`,
      },
    });

    return res.status(200).json({
      message: `Site Visit ${visit.booking_code} schedule ${nextStatus}! Transferred to Project Manager.`,
      visit: updated,
    });
  } catch (error: any) {
    console.error('Verify site visit error:', error);
    return res.status(500).json({ error: 'Failed to verify site visit' });
  }
});

// POST /api/v1/site-visits/:id/assign-agent - PM assigns Field Agent for Site Visit
router.post(
  '/:id/assign-agent',
  authenticateToken,
  requireRole([Roles.PROJECT_MANAGER, Roles.MD, Roles.ADMIN]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const visitId = parseInt(req.params.id, 10);
      const { agent_id, notes } = req.body;
      const employeeId = req.user?.employeeId || (req.user as any)?.userId || (req.user as any)?.id || 1;

      const visit = await p.siteVisitBooking.findUnique({ where: { id: visitId } });
      if (!visit) {
        return res.status(404).json({ error: 'Site visit booking not found' });
      }

      const agent = await p.employee.findUnique({ where: { id: agent_id } });

      const updated = await p.siteVisitBooking.update({
        where: { id: visitId },
        data: {
          assigned_agent_id: agent_id,
          status: 'ASSIGNED_TO_AGENT',
        },
      });

      await p.leadActivity.create({
        data: {
          lead_id: visit.lead_id,
          actor_id: employeeId,
          activity_type: 'AGENT_DISPATCHED_FOR_SITE_VISIT',
          notes: `PM assigned Field Agent ${agent ? agent.full_name : agent_id} to conduct site visit ${visit.booking_code}.${notes ? ` Notes: ${notes}` : ''}`,
        },
      });

      return res.status(200).json({
        message: `Field Agent assigned for site visit ${visit.booking_code}!`,
        visit: updated,
      });
    } catch (error: any) {
      console.error('Assign agent error:', error);
      return res.status(500).json({ error: 'Failed to assign field agent' });
    }
  }
);

// POST /api/v1/site-visits/:id/complete - Complete Site Visit, Upload Feedback & Proof Photo
router.post('/:id/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const visitId = parseInt(req.params.id, 10);
    const { feedback_notes, rating, proof_photo_url } = req.body;
    const employeeId = req.user?.employeeId || (req.user as any)?.userId || (req.user as any)?.id || 1;

    const visit = await p.siteVisitBooking.findUnique({ where: { id: visitId } });
    if (!visit) {
      return res.status(404).json({ error: 'Site visit booking not found' });
    }

    const updated = await p.siteVisitBooking.update({
      where: { id: visitId },
      data: {
        status: 'COMPLETED',
        feedback_notes,
        rating: rating || 'HOT_INTERESTED',
        proof_photo_url: proof_photo_url || null,
        completed_at: new Date(),
      },
    });

    // Update Lead Status
    const nextLeadStatus = rating === 'HOT_INTERESTED' ? 'QUALIFIED' : rating === 'WARM' ? 'NEGOTIATION' : 'CONTACTED';
    await p.lead.update({
      where: { id: visit.lead_id },
      data: { status: nextLeadStatus },
    });

    await p.leadActivity.create({
      data: {
        lead_id: visit.lead_id,
        actor_id: employeeId,
        activity_type: 'SITE_VISIT_COMPLETED',
        notes: `Site Visit Completed! Rating: ${rating}. Feedback: ${feedback_notes}${proof_photo_url ? ' (Proof Photo Uploaded)' : ''}`,
      },
    });

    return res.status(200).json({
      message: `Site Visit ${visit.booking_code} completed! Customer feedback & photo recorded. Lead updated to ${nextLeadStatus}.`,
      visit: updated,
    });
  } catch (error: any) {
    console.error('Complete site visit error:', error);
    return res.status(500).json({ error: 'Failed to complete site visit' });
  }
});

export default router;
