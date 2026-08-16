import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middleware/auth';
import { Permissions } from '@rrh-ems/shared';
import { OpportunityService } from '../services/opportunity.service';

const router = Router();

// POST /api/v1/opportunities
router.post(
  '/',
  authenticateToken,
  requirePermission([Permissions.LEADS_UPDATE]), // Assuming lead management permissions govern opportunity creation
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const opportunity = await OpportunityService.createFromLead(req.user!, req.body);
      return res.status(201).json({
        message: 'Opportunity created successfully',
        opportunity,
      });
    } catch (error: any) {
      console.error('Create opportunity error:', error);
      return res.status(error.statusCode || error.status || 500).json({ error: error.message || 'Failed to create opportunity' });
    }
  }
);

// GET /api/v1/opportunities
router.get(
  '/',
  authenticateToken,
  requirePermission([Permissions.LEADS_READ]), 
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { stage, owner_id, project_id, property_id, date_from, date_to, expected_close_from, expected_close_to, sort_by, sort_order, limit, offset } = req.query;
      const filters = {
        stage: stage as string,
        owner_id: owner_id as string,
        project_id: project_id as string,
        property_id: property_id as string,
        date_from: date_from as string,
        date_to: date_to as string,
        expected_close_from: expected_close_from as string,
        expected_close_to: expected_close_to as string,
        sort_by: sort_by as string,
        sort_order: sort_order as string,
        limit: limit as string,
        offset: offset as string,
      };

      const result = await OpportunityService.getOpportunities(req.user!, filters);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Fetch opportunities error:', error);
      return res.status(error.statusCode || error.status || 500).json({ error: error.message || 'Failed to fetch opportunities' });
    }
  }
);

// GET /api/v1/opportunities/pipeline-metrics
router.get(
  '/pipeline-metrics',
  authenticateToken,
  requirePermission([Permissions.LEADS_READ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const metrics = await OpportunityService.getPipelineMetrics(req.user!);
      return res.status(200).json({ metrics });
    } catch (error: any) {
      console.error('Fetch pipeline metrics error:', error);
      return res.status(error.statusCode || error.status || 500).json({ error: error.message || 'Failed to fetch pipeline metrics' });
    }
  }
);

// GET /api/v1/opportunities/conversion-metrics
router.get(
  '/conversion-metrics',
  authenticateToken,
  requirePermission([Permissions.LEADS_READ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const metrics = await OpportunityService.getConversionMetrics(req.user!);
      return res.status(200).json({ metrics });
    } catch (error: any) {
      console.error('Fetch conversion metrics error:', error);
      return res.status(error.statusCode || error.status || 500).json({ error: error.message || 'Failed to fetch conversion metrics' });
    }
  }
);

// GET /api/v1/opportunities/:id/history
router.get(
  '/:id/history',
  authenticateToken,
  requirePermission([Permissions.LEADS_READ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const history = await OpportunityService.getOpportunityHistory(req.user!, id);
      return res.status(200).json({ history });
    } catch (error: any) {
      console.error('Fetch opportunity history error:', error);
      return res.status(error.statusCode || error.status || 500).json({ error: error.message || 'Failed to fetch opportunity history' });
    }
  }
);

// GET /api/v1/opportunities/:id
router.get(
  '/:id',
  authenticateToken,
  requirePermission([Permissions.LEADS_READ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const opportunity = await OpportunityService.getOpportunityById(req.user!, id);
      return res.status(200).json({ opportunity });
    } catch (error: any) {
      console.error('Fetch opportunity dossier error:', error);
      return res.status(error.statusCode || error.status || 500).json({ error: error.message || 'Failed to fetch opportunity' });
    }
  }
);

// PATCH /api/v1/opportunities/:id
router.patch(
  '/:id',
  authenticateToken,
  requirePermission([Permissions.LEADS_UPDATE]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const opportunity = await OpportunityService.updateOpportunity(req.user!, id, req.body);
      return res.status(200).json({
        message: 'Opportunity updated successfully',
        opportunity,
      });
    } catch (error: any) {
      console.error('Update opportunity error:', error);
      return res.status(error.statusCode || error.status || 500).json({ error: error.message || 'Failed to update opportunity' });
    }
  }
);

// PATCH /api/v1/opportunities/:id/stage
router.patch(
  '/:id/stage',
  authenticateToken,
  requirePermission([Permissions.LEADS_UPDATE]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { stage, drop_reason } = req.body;
      const opportunity = await OpportunityService.updateStage(req.user!, id, stage, drop_reason);
      return res.status(200).json({
        message: `Opportunity transitioned to ${stage}`,
        opportunity,
      });
    } catch (error: any) {
      console.error('Update opportunity stage error:', error);
      return res.status(error.statusCode || error.status || 500).json({ error: error.message || 'Failed to update opportunity stage' });
    }
  }
);

// POST /api/v1/opportunities/:id/convert-to-booking
router.post(
  '/:id/convert-to-booking',
  authenticateToken,
  requirePermission([Permissions.LEADS_UPDATE]), // Requires same update permission
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const booking = await OpportunityService.convertToBooking(req.user!, id, req.body);
      return res.status(201).json({
        message: 'Opportunity converted to Booking successfully',
        booking,
      });
    } catch (error: any) {
      console.error('Convert opportunity to booking error:', error);
      return res.status(error.statusCode || error.status || 500).json({ error: error.message || 'Failed to convert opportunity to booking' });
    }
  }
);

export default router;
