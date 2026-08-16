import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireAuthz } from '../middleware/authz';
import {
  PropertyCreateSchema,
  PropertyVerificationSchema,
  PropertyDMUpdateSchema,
  PropertyMDApprovalSchema,
  PropertyUpdateSchema,
  Permissions,
} from '@rrh-ems/shared';
import { validateRequestBody } from '../middleware/validate';
import { PropertyService } from '../services/property.service';
import { propertyImageUpload, getPublicPath, extractFilename, deleteFile } from '../services/storage.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const p = prisma as any;

// GET /api/v1/properties - List properties with brand and status filtering
router.get(
  '/',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_READ),
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { brand, status, project_id } = req.query;
    const filters = {
      brand: typeof brand === 'string' ? brand : undefined,
      status: typeof status === 'string' ? status : undefined,
      project_id: typeof project_id === 'string' ? parseInt(project_id, 10) : undefined,
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

// PUT /api/v1/properties/:id - Update Property Listing
router.put(
  '/:id',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_UPDATE),
  validateRequestBody(PropertyUpdateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const property = await PropertyService.updateProperty(req.user!, propertyId, req.body);
      return res.status(200).json({
        message: 'Property listing updated successfully',
        property,
      });
    } catch (error: any) {
      console.error('Update property error:', error);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to update property listing' });
    }
  }
);

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

// POST /api/v1/properties/:id/publications - Toggle publication for a brand
router.post(
  '/:id/publications',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_UPDATE),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const { company_id, is_published } = req.body;

      if (!company_id || typeof is_published !== 'boolean') {
        return res.status(400).json({ error: 'company_id and is_published (boolean) are required' });
      }

      const publication = await PropertyService.togglePublication(
        req.user!,
        propertyId,
        company_id,
        is_published
      );

      return res.status(200).json({
        message: `Property ${is_published ? 'published' : 'unpublished'} successfully`,
        publication,
      });
    } catch (error: any) {
      console.error('Toggle publication error:', error);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to toggle publication' });
    }
  }
);

// GET /api/v1/properties/:id/publications - List publications for a property
router.get(
  '/:id/publications',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_READ),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const publications = await PropertyService.getPublications(req.user!, propertyId);
      return res.status(200).json({ publications });
    } catch (error: any) {
      console.error('Get publications error:', error);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to fetch publications' });
    }
  }
);

// POST /api/v1/properties/:id/images - Upload property image
router.post(
  '/:id/images',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_UPDATE),
  propertyImageUpload.single('image'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const companyId = req.user!.companyId;

      // Verify property exists and belongs to company
      const property = await p.property.findFirst({
        where: { id: propertyId, company_id: companyId },
      });
      if (!property) {
        return res.status(404).json({ error: 'Property not found or unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const imageUrl = getPublicPath(req.file.filename);
      const { alt_text, sort_order, is_primary } = req.body;

      const image = await p.propertyImage.create({
        data: {
          property_id: propertyId,
          image_url: imageUrl,
          is_primary: is_primary === 'true' || is_primary === true,
          uploaded_by_id: req.user!.employeeId,
          sort_order: sort_order ? parseInt(sort_order, 10) : 0,
          alt_text: alt_text || null,
          status: 'PENDING',
        },
      });

      return res.status(201).json({ message: 'Image uploaded successfully', image });
    } catch (error: any) {
      console.error('Upload property image error:', error);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// PUT /api/v1/properties/:id/images/:imageId - Update image metadata
router.put(
  '/:id/images/:imageId',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_UPDATE),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const imageId = parseInt(req.params.imageId, 10);
      const companyId = req.user!.companyId;

      // Verify property belongs to company
      const property = await p.property.findFirst({
        where: { id: propertyId, company_id: companyId },
      });
      if (!property) {
        return res.status(404).json({ error: 'Property not found or unauthorized' });
      }

      // Verify image belongs to property
      const image = await p.propertyImage.findFirst({
        where: { id: imageId, property_id: propertyId },
      });
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }

      const { alt_text, sort_order, is_primary } = req.body;
      const updateData: any = {};

      if (alt_text !== undefined) updateData.alt_text = alt_text || null;
      if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order, 10);
      if (is_primary !== undefined) updateData.is_primary = is_primary === 'true' || is_primary === true;

      const updated = await p.propertyImage.update({
        where: { id: imageId },
        data: updateData,
      });

      return res.status(200).json({ message: 'Image updated successfully', image: updated });
    } catch (error: any) {
      console.error('Update property image error:', error);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to update image' });
    }
  }
);

// DELETE /api/v1/properties/:id/images/:imageId - Delete property image
router.delete(
  '/:id/images/:imageId',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_UPDATE),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const imageId = parseInt(req.params.imageId, 10);
      const companyId = req.user!.companyId;

      // Verify property belongs to company
      const property = await p.property.findFirst({
        where: { id: propertyId, company_id: companyId },
      });
      if (!property) {
        return res.status(404).json({ error: 'Property not found or unauthorized' });
      }

      // Verify image belongs to property
      const image = await p.propertyImage.findFirst({
        where: { id: imageId, property_id: propertyId },
      });
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }

      // Delete file from disk
      const filename = extractFilename(image.image_url);
      if (filename) deleteFile(filename);

      // Delete record
      await p.propertyImage.delete({ where: { id: imageId } });

      return res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error: any) {
      console.error('Delete property image error:', error);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to delete image' });
    }
  }
);

// POST /api/v1/properties/:id/images/:imageId/approve - Approve image
router.post(
  '/:id/images/:imageId/approve',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_DM_POLISH),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const imageId = parseInt(req.params.imageId, 10);

      const image = await p.propertyImage.findFirst({
        where: { id: imageId, property_id: propertyId },
      });
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }

      const updated = await p.propertyImage.update({
        where: { id: imageId },
        data: { status: 'APPROVED' },
      });

      return res.status(200).json({ message: 'Image approved', image: updated });
    } catch (error: any) {
      console.error('Approve image error:', error);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to approve image' });
    }
  }
);

// POST /api/v1/properties/:id/images/:imageId/reject - Reject image
router.post(
  '/:id/images/:imageId/reject',
  authenticateToken,
  requireAuthz(Permissions.PROPERTIES_DM_POLISH),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const imageId = parseInt(req.params.imageId, 10);

      const image = await p.propertyImage.findFirst({
        where: { id: imageId, property_id: propertyId },
      });
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }

      const updated = await p.propertyImage.update({
        where: { id: imageId },
        data: { status: 'REJECTED' },
      });

      return res.status(200).json({ message: 'Image rejected', image: updated });
    } catch (error: any) {
      console.error('Reject image error:', error);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to reject image' });
    }
  }
);

export default router;
