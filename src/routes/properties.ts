import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireAuthz } from '../middleware/authz';
import {
  PropertyCreateSchema,
  PropertyVerificationSchema,
  PropertyDMUpdateSchema,
  PropertyMDApprovalSchema,
  Permissions,
} from '@rrh-ems/shared';
import { validateRequestBody } from '../middleware/validate';
import { PropertyService } from '../services/property.service';

const router = Router();

// GET /api/v1/properties - List properties with brand and status filtering
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { brand, status } = req.query;
    const filters = {
      brand: typeof brand === 'string' ? brand : undefined,
      status: typeof status === 'string' ? status : undefined,
    };

    const properties = await PropertyService.listProperties(req.user!, filters);
    return res.status(200).json({ properties });
  } catch (error: any) {
    console.error('Fetch properties error:', error);
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// POST /api/v1/properties - Create Property Listing
router.post(
  '/',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_CREATE),
  validateRequestBody(PropertyCreateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const property = await PropertyService.createProperty(req.user!, req.body);
    return res.status(201).json({
      message: 'Property listing created and submitted for PM On-Site Verification',
      property,
    });
  } catch (error: any) {
    console.error('Create property error:', error);
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to create property listing' });
  }
});

// POST /api/v1/properties/:id/verify - PM On-Site Verification Step
router.post(
  '/:id/verify',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_VERIFY),
  validateRequestBody(PropertyVerificationSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const updated = await PropertyService.verifyProperty(req.user!, propertyId, req.body);

      return res.status(200).json({
        message: `Property ${updated.property_code} verification updated to ${updated.status}`,
        property: updated,
      });
    } catch (error: any) {
      console.error('PM Verify error:', error);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to execute PM verification step' });
    }
  }
);

// POST /api/v1/properties/:id/dm-polish - Digital Marketing Polish & SEO Tagging Step
router.post(
  '/:id/dm-polish',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_DM_POLISH),
  validateRequestBody(PropertyDMUpdateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const updated = await PropertyService.dmPolishProperty(req.user!, propertyId, req.body);

      return res.status(200).json({
        message: `Property ${updated.property_code} polished by DM team and submitted for MD Approval`,
        property: updated,
      });
    } catch (error: any) {
      console.error('DM Polish error:', error);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to execute DM polish step' });
    }
  }
);

// POST /api/v1/properties/:id/md-approve - MD Final Approval Step (Go Live)
router.post(
  '/:id/md-approve',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_MD_APPROVE),
  validateRequestBody(PropertyMDApprovalSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const updated = await PropertyService.mdApproveProperty(req.user!, propertyId, req.body);

      return res.status(200).json({
        message: `Property ${updated.property_code} is now ${updated.status}`,
        property: updated,
      });
    } catch (error: any) {
      console.error('MD Approve error:', error);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to execute MD approval step' });
    }
  }
);

export default router;
