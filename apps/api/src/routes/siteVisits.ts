import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middleware/auth';
import { Permissions } from '@rrh-ems/shared';
import { SiteVisitService } from '../services/siteVisit.service';

const router = Router();

// GET /api/v1/site-visits - List site visits (role and company-aware)
router.get(
  '/',
  authenticateToken,
  requirePermission([Permissions.SITE_VISITS_READ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, leadId } = req.query;
      const filters = {
        status: status as string,
        leadId: leadId as string,
      };

      const visits = await SiteVisitService.listVisits(req.user!, filters);
      return res.status(200).json({ visits });
    } catch (error: any) {
      console.error('Fetch site visits error:', error);
      return res.status(error.status || 500).json({ error: error.message || 'Failed to fetch site visit bookings' });
    }
  }
);

// POST /api/v1/site-visits - Telecaller books site visit
router.post(
  '/',
  authenticateToken,
  requirePermission([Permissions.SITE_VISITS_CREATE]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const booking = await SiteVisitService.bookVisit(req.user!, req.body);
      return res.status(201).json({
        message: `Site visit ${booking.booking_code} booked! Verification call pending.`,
        booking,
      });
    } catch (error: any) {
      console.error('Book site visit error:', error);
      return res.status(error.status || 500).json({ error: error.message || 'Failed to book site visit' });
    }
  }
);

// POST /api/v1/site-visits/:id/verify - Verify & confirm schedule
router.post(
  '/:id/verify',
  authenticateToken,
  requirePermission([Permissions.SITE_VISITS_VERIFY]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const visitId = parseInt(req.params.id, 10);
      const { confirmed, verification_notes } = req.body;

      const visit = await SiteVisitService.verifyVisit(req.user!, visitId, confirmed, verification_notes);
      
      const nextStatus = confirmed ? 'CONFIRMED' : 'CANCELLED';
      return res.status(200).json({
        message: `Site Visit ${visit.booking_code} schedule ${nextStatus}! Transferred to Project Manager.`,
        visit,
      });
    } catch (error: any) {
      console.error('Verify site visit error:', error);
      return res.status(error.status || 500).json({ error: error.message || 'Failed to verify site visit' });
    }
  }
);

// POST /api/v1/site-visits/:id/assign-agent - PM assigns Field Agent for Site Visit
router.post(
  '/:id/assign-agent',
  authenticateToken,
  requirePermission([Permissions.SITE_VISITS_ASSIGN_AGENT]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const visitId = parseInt(req.params.id, 10);
      const { agent_id, notes } = req.body;

      const visit = await SiteVisitService.assignAgent(req.user!, visitId, agent_id, notes);
      return res.status(200).json({
        message: `Field Agent assigned for site visit ${visit.booking_code}!`,
        visit,
      });
    } catch (error: any) {
      console.error('Assign agent error:', error);
      return res.status(error.status || 500).json({ error: error.message || 'Failed to assign field agent' });
    }
  }
);

// POST /api/v1/site-visits/:id/complete - Complete Site Visit, Upload Feedback & Proof Photo
router.post(
  '/:id/complete',
  authenticateToken,
  requirePermission([Permissions.SITE_VISITS_COMPLETE]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const visitId = parseInt(req.params.id, 10);
      const { feedback_notes, rating, proof_photo_url } = req.body;

      const visit = await SiteVisitService.completeVisit(req.user!, visitId, rating, feedback_notes, proof_photo_url);
      
      const nextLeadStatus = rating === 'HOT_INTERESTED' ? 'QUALIFIED' : rating === 'WARM' ? 'NEGOTIATION' : 'CONTACTED';
      
      return res.status(200).json({
        message: `Site Visit ${visit.booking_code} completed! Customer feedback & photo recorded. Lead updated to ${nextLeadStatus}.`,
        visit,
      });
    } catch (error: any) {
      console.error('Complete site visit error:', error);
      return res.status(error.status || 500).json({ error: error.message || 'Failed to complete site visit' });
    }
  }
);

export default router;
