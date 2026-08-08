import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import {
  Roles,
  PropertyCreateSchema,
  PropertyVerificationSchema,
  PropertyDMUpdateSchema,
  PropertyMDApprovalSchema,
} from '@rrh-ems/shared';
import { validateRequestBody } from '../middleware/validate';

const router = Router();
const prisma = new PrismaClient();
const p = prisma as any;

// Sequential Property Code Generator: RRH-PR-YYYY-XXXX
const generateNextPropertyCode = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await p.property.count();
  const seq = (count + 1).toString().padStart(4, '0');
  return `RRH-PR-${currentYear}-${seq}`;
};

// GET /api/v1/properties - List properties with brand and status filtering
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { brand, status } = req.query;
    const companyId = req.user?.companyId || (req.user as any)?.company_id || 1;

    const whereCondition: any = { company_id: companyId };
    if (brand && typeof brand === 'string') {
      whereCondition.brand_type = brand;
    }
    if (status && typeof status === 'string') {
      whereCondition.status = status;
    }

    const properties = await p.property.findMany({
      where: whereCondition,
      include: {
        assigned_pm: { select: { id: true, employee_code: true, full_name: true, phone: true } },
        created_by: { select: { id: true, employee_code: true, full_name: true } },
        images: true,
        verification_logs: {
          orderBy: { created_at: 'desc' },
          include: { actor: { select: { id: true, employee_code: true, full_name: true } } },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({ properties });
  } catch (error: any) {
    console.error('Fetch properties error:', error);
    return res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// POST /api/v1/properties - Create Property Listing (Starts at PENDING_VERIFICATION)
router.post('/', authenticateToken, validateRequestBody(PropertyCreateSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      brand_type,
      category,
      price,
      area_sqft,
      location,
      address,
      bedrooms,
      bathrooms,
      facing,
      amenities,
      possession_status,
      assigned_pm_id,
      details,
    } = req.body;

    const companyId = req.user?.companyId || (req.user as any)?.company_id || 1;
    const branchId = req.user?.branchId || (req.user as any)?.branch_id || 1;
    const employeeId = req.user?.employeeId || (req.user as any)?.userId || (req.user as any)?.id || 1;

    const propertyCode = await generateNextPropertyCode();

    // Optional auto-assign to PM if none provided
    let finalPmId = assigned_pm_id;
    if (!finalPmId) {
      const pm = await p.employee.findFirst({
        where: {
          company_id: companyId,
          status: 'ACTIVE',
          roles: { some: { role: { name: Roles.PROJECT_MANAGER } } },
        },
      });
      if (pm) finalPmId = pm.id;
    }

    const property = await p.property.create({
      data: {
        property_code: propertyCode,
        company_id: companyId,
        branch_id: branchId,
        title,
        description: description || null,
        brand_type,
        category,
        price,
        area_sqft,
        location,
        address: address || null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        facing: facing || null,
        amenities: amenities || null,
        possession_status: possession_status || null,
        details: details || null,
        assigned_pm_id: finalPmId,
        status: 'PENDING_VERIFICATION',
        created_by_id: employeeId,
      },
    });

    const faqs = req.body.faqs;
    if (faqs && Array.isArray(faqs) && faqs.length > 0) {
      await p.propertyFAQ.createMany({
        data: faqs.map((f: any) => ({
          property_id: property.id,
          question: f.question,
          answer: f.answer,
        }))
      });
    }

    // Also record initial verification log
    await p.propertyVerificationLog.create({
      data: {
        property_id: property.id,
        actor_id: req.user!.employeeId,
        from_status: 'DRAFT',
        to_status: 'PENDING_VERIFICATION',
        notes: `Property ${property.property_code} submitted. Assigned to PM ID ${finalPmId || 'Queue'} for On-Site Verification.`,
      },
    });

    return res.status(201).json({
      message: 'Property listing created and submitted for PM On-Site Verification',
      property,
    });
  } catch (error: any) {
    console.error('Create property error:', error);
    return res.status(500).json({ error: 'Failed to create property listing' });
  }
});

// POST /api/v1/properties/:id/verify - PM On-Site Verification Step
router.post(
  '/:id/verify',
  authenticateToken,
  requireRole([Roles.PROJECT_MANAGER, Roles.MD, Roles.ADMIN]),
  validateRequestBody(PropertyVerificationSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const { approved, notes } = req.body;

      const property = await p.property.findUnique({ where: { id: propertyId } });
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      const nextStatus = approved ? 'PENDING_DM_POLISH' : 'REJECTED';

      const updated = await p.property.update({
        where: { id: propertyId },
        data: {
          status: nextStatus,
          verified_by_pm_at: approved ? new Date() : null,
          rejection_reason: approved ? null : notes,
        },
      });

      await p.propertyVerificationLog.create({
        data: {
          property_id: propertyId,
          actor_id: req.user!.employeeId,
          from_status: property.status,
          to_status: nextStatus,
          notes: `PM On-Site Verification: ${approved ? 'PASSED' : 'REJECTED'}. Notes: ${notes}`,
        },
      });

      return res.status(200).json({
        message: `Property ${property.property_code} verification updated to ${nextStatus}`,
        property: updated,
      });
    } catch (error: any) {
      console.error('PM Verify error:', error);
      return res.status(500).json({ error: 'Failed to execute PM verification step' });
    }
  }
);

// POST /api/v1/properties/:id/dm-polish - Digital Marketing Polish & SEO Tagging Step
router.post(
  '/:id/dm-polish',
  authenticateToken,
  requireRole([Roles.DIGITAL_LEAD_OPERATOR, Roles.DIGITAL_MARKETING_HEAD, Roles.MARKETING_DIRECTOR, Roles.MD, Roles.ADMIN]),
  validateRequestBody(PropertyDMUpdateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const { seo_title, seo_keywords, description, notes } = req.body;

      const property = await p.property.findUnique({ where: { id: propertyId } });
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      const updated = await p.property.update({
        where: { id: propertyId },
        data: {
          status: 'PENDING_MD_APPROVAL',
          seo_title: seo_title || property.seo_title,
          seo_keywords: seo_keywords || property.seo_keywords,
          description: description || property.description,
          dm_polished_at: new Date(),
        },
      });

      await p.propertyVerificationLog.create({
        data: {
          property_id: propertyId,
          actor_id: req.user!.employeeId,
          from_status: property.status,
          to_status: 'PENDING_MD_APPROVAL',
          notes: `Digital Marketing Polish Completed. Submitted for MD Final Approval.${notes ? ` Notes: ${notes}` : ''}`,
        },
      });

      return res.status(200).json({
        message: `Property ${property.property_code} polished by DM team and submitted for MD Approval`,
        property: updated,
      });
    } catch (error: any) {
      console.error('DM Polish error:', error);
      return res.status(500).json({ error: 'Failed to execute DM polish step' });
    }
  }
);

// POST /api/v1/properties/:id/md-approve - MD Final Approval Step (Go Live)
router.post(
  '/:id/md-approve',
  authenticateToken,
  requireRole([Roles.MD, Roles.ADMIN]),
  validateRequestBody(PropertyMDApprovalSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id, 10);
      const { approved, comments } = req.body;

      const property = await p.property.findUnique({ where: { id: propertyId } });
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      const nextStatus = approved ? 'LIVE' : 'REJECTED';

      const updated = await p.property.update({
        where: { id: propertyId },
        data: {
          status: nextStatus,
          md_approved_at: approved ? new Date() : null,
          rejection_reason: approved ? null : comments,
        },
      });

      await p.propertyVerificationLog.create({
        data: {
          property_id: propertyId,
          actor_id: req.user!.employeeId,
          from_status: property.status,
          to_status: nextStatus,
          notes: `MD Decision: ${approved ? 'APPROVED & LIVE' : 'REJECTED'}.${comments ? ` Comments: ${comments}` : ''}`,
        },
      });

      // Write Audit Event
      await p.auditEvent.create({
        data: {
          actor_id: req.user!.employeeId,
          action: approved ? 'PROPERTY_MD_APPROVED_LIVE' : 'PROPERTY_MD_REJECTED',
          entity_type: 'PROPERTY',
          entity_id: propertyId,
          old_value: JSON.stringify({ status: property.status }),
          new_value: JSON.stringify({ status: nextStatus, comments }),
        },
      });

      return res.status(200).json({
        message: `Property ${property.property_code} is now ${nextStatus}`,
        property: updated,
      });
    } catch (error: any) {
      console.error('MD Approve error:', error);
      return res.status(500).json({ error: 'Failed to execute MD approval step' });
    }
  }
);

export default router;
