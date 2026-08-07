import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { Roles, LeadCreateSchema, LeadStatusUpdateSchema, LeadReassignSchema } from '@rrh-ems/shared';
import { validateRequestBody } from '../middleware/validate';
import { findBestAssigneeForLead } from '../utils/distributionService';
import { findMatchingPropertiesForLead, generateWhatsAppText } from '../utils/matchingEngine';

const router = Router();
const prisma = new PrismaClient();
const p = prisma as any;

// Helper to generate sequential static lead code: RRH-LD-YYYY-XXXX
const generateNextLeadCode = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await p.lead.count();
  const sequentialNum = (count + 1).toString().padStart(4, '0');
  return `RRH-LD-${currentYear}-${sequentialNum}`;
};

// GET /api/v1/leads - Fetch leads list (Role-aware)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRoles = req.user?.roles || [];
    const companyId = req.user?.companyId || (req.user as any)?.company_id || 1;
    const employeeId = req.user?.employeeId || (req.user as any)?.userId || (req.user as any)?.id || 1;

    const isManagement = userRoles.some((r) =>
      [Roles.MD, Roles.ADMIN, Roles.HR_MANAGER, Roles.MARKETING_DIRECTOR, Roles.DIGITAL_LEAD_OPERATOR].includes(r as any)
    );

    const whereCondition: any = { company_id: companyId };

    // Telecallers and Agents see only their assigned leads
    if (!isManagement) {
      whereCondition.assigned_to_id = employeeId;
    }

    const leads = await p.lead.findMany({
      where: whereCondition,
      include: {
        assigned_to: { select: { id: true, employee_code: true, full_name: true, phone: true } },
        created_by: { select: { id: true, employee_code: true, full_name: true } },
        activities: {
          orderBy: { created_at: 'desc' },
          take: 5,
          include: { actor: { select: { id: true, employee_code: true, full_name: true } } },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({ leads });
  } catch (error: any) {
    console.error('Fetch leads error:', error);
    return res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// GET /api/v1/leads/distribution-monitor - Telecaller load & intake monitor for Digital Lead Operator
router.get('/distribution-monitor', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || (req.user as any)?.company_id || 1;

    const telecallers = await p.employee.findMany({
      where: {
        company_id: companyId,
        status: 'ACTIVE',
        roles: {
          some: { role: { name: { in: [Roles.TELECALLER, Roles.AGENT] } } },
        },
      },
      select: { id: true, employee_code: true, full_name: true, department: true },
    });

    const monitorData = [];
    for (const emp of telecallers) {
      const activeLeadCount = await p.lead.count({
        where: {
          assigned_to_id: emp.id,
          status: { in: ['NEW', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'SITE_VISIT_SCHEDULED'] },
        },
      });

      const totalAssigned = await p.lead.count({ where: { assigned_to_id: emp.id } });
      const totalWon = await p.lead.count({ where: { assigned_to_id: emp.id, status: 'WON' } });

      monitorData.push({
        id: emp.id,
        employeeCode: emp.employee_code,
        fullName: emp.full_name || emp.employee_code,
        activeLeadCount,
        totalAssigned,
        totalWon,
        closureRate: totalAssigned > 0 ? ((totalWon / totalAssigned) * 100).toFixed(1) + '%' : '0.0%',
      });
    }

    const totalLeadsCount = await p.lead.count({ where: { company_id: companyId } });
    const unassignedCount = await p.lead.count({
      where: { company_id: companyId, assigned_to_id: null },
    });

    return res.status(200).json({
      totalLeadsCount,
      unassignedCount,
      telecallers: monitorData,
    });
  } catch (error: any) {
    console.error('Distribution monitor error:', error);
    return res.status(500).json({ error: 'Failed to fetch distribution metrics' });
  }
});

// POST /api/v1/leads - Create lead (with automatic performance-weighted distribution)
router.post('/', authenticateToken, validateRequestBody(LeadCreateSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      customer_name,
      phone,
      email,
      source,
      property_type_preference,
      budget_min,
      budget_max,
      preferred_location,
      notes,
    } = req.body;

    const leadCode = await generateNextLeadCode();

    // Run performance-weighted distribution engine
    const bestAssignee = await findBestAssigneeForLead(req.user!.companyId);

    const lead = await p.lead.create({
      data: {
        lead_code: leadCode,
        company_id: req.user!.companyId,
        branch_id: req.user!.branchId,
        customer_name,
        phone,
        email: email || null,
        source: source || 'MANUAL_ENTRY',
        status: bestAssignee ? 'ASSIGNED' : 'NEW',
        assigned_to_id: bestAssignee ? bestAssignee.employeeId : null,
        assigned_at: bestAssignee ? new Date() : null,
        assignment_type: bestAssignee ? 'PERFORMANCE_WEIGHTED' : null,
        property_type_preference: property_type_preference || null,
        budget_min: budget_min || null,
        budget_max: budget_max || null,
        preferred_location: preferred_location || null,
        notes: notes || null,
        created_by_id: req.user!.employeeId,
      },
    });

    // Create activity logs
    await p.leadActivity.create({
      data: {
        lead_id: lead.id,
        actor_id: req.user!.employeeId,
        activity_type: 'LEAD_CREATED',
        notes: `Lead ${lead.lead_code} registered via ${lead.source}`,
      },
    });

    if (bestAssignee) {
      await p.leadActivity.create({
        data: {
          lead_id: lead.id,
          actor_id: req.user!.employeeId,
          activity_type: 'ASSIGNED_TO_AGENT',
          notes: `Auto-distributed to ${bestAssignee.name} (${bestAssignee.employeeCode}) [Weight Score: ${bestAssignee.weight.toFixed(1)}]`,
        },
      });

      // Send notification to assignee
      await p.notification.create({
        data: {
          employee_id: bestAssignee.employeeId,
          type: 'TARGET_ASSIGNED',
          title: 'New Lead Auto-Assigned',
          message: `New Lead ${lead.customer_name} (${lead.phone}) has been assigned to you.`,
        },
      });
    }

    return res.status(201).json({
      message: 'Lead created successfully',
      lead,
      assignedTo: bestAssignee,
    });
  } catch (error: any) {
    console.error('Create lead error:', error);
    return res.status(500).json({ error: 'Failed to create lead' });
  }
});

// POST /api/v1/leads/bulk-upload - Bulk CSV/Excel importer (Digital Lead Operator / MD / Admin)
router.post(
  '/bulk-upload',
  authenticateToken,
  requireRole([Roles.DIGITAL_LEAD_OPERATOR, Roles.MARKETING_DIRECTOR, Roles.MD, Roles.ADMIN]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { leads: rawLeads } = req.body;
      if (!Array.isArray(rawLeads) || rawLeads.length === 0) {
        return res.status(400).json({ error: 'Array of lead rows required in body under "leads"' });
      }

      const companyId = req.user?.companyId || (req.user as any)?.company_id || 1;
      const branchId = req.user?.branchId || (req.user as any)?.branch_id || 1;
      const employeeId = req.user?.employeeId || (req.user as any)?.userId || (req.user as any)?.id || 1;

      let insertedCount = 0;
      const createdLeads = [];

      for (const item of rawLeads) {
        if (!item.customer_name || !item.phone) continue;

        const leadCode = await generateNextLeadCode();
        const bestAssignee = await findBestAssigneeForLead(companyId);

        const newLead = await p.lead.create({
          data: {
            lead_code: leadCode,
            company_id: companyId,
            branch_id: branchId,
            customer_name: item.customer_name,
            phone: item.phone,
            email: item.email || null,
            source: 'BULK_UPLOAD',
            status: bestAssignee ? 'ASSIGNED' : 'NEW',
            assigned_to_id: bestAssignee ? bestAssignee.employeeId : null,
            assigned_at: bestAssignee ? new Date() : null,
            assignment_type: bestAssignee ? 'PERFORMANCE_WEIGHTED' : null,
            property_type_preference: item.property_type || null,
            preferred_location: item.location || null,
            notes: item.notes || 'Imported via Digital Lead Operator Bulk Upload',
            created_by_id: employeeId,
          },
        });

        await p.leadActivity.create({
          data: {
            lead_id: newLead.id,
            actor_id: employeeId,
            activity_type: 'LEAD_CREATED',
            notes: `Bulk Upload Lead ${newLead.lead_code} created by Digital Lead Operator`,
          },
        });

        if (bestAssignee) {
          await p.leadActivity.create({
            data: {
              lead_id: newLead.id,
              actor_id: employeeId,
              activity_type: 'ASSIGNED_TO_AGENT',
              notes: `Weighted Auto-Distribution to ${bestAssignee.name} (${bestAssignee.employeeCode})`,
            },
          });
        }

        insertedCount++;
        createdLeads.push(newLead);
      }

      return res.status(200).json({
        message: `Successfully processed and auto-distributed ${insertedCount} leads`,
        count: insertedCount,
      });
    } catch (error: any) {
      console.error('Bulk lead upload error:', error);
      return res.status(500).json({ error: 'Bulk lead processing failed' });
    }
  }
);

// POST /api/v1/leads/:id/assign - Manual Re-assignment Override (Audited)
router.post(
  '/:id/assign',
  authenticateToken,
  requireRole([Roles.DIGITAL_LEAD_OPERATOR, Roles.MARKETING_DIRECTOR, Roles.MD, Roles.ADMIN]),
  validateRequestBody(LeadReassignSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const leadId = parseInt(req.params.id, 10);
      const { assigned_to_id, reason } = req.body;

      const lead = await p.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      const assignee = await p.employee.findUnique({ where: { id: assigned_to_id } });
      if (!assignee) {
        return res.status(404).json({ error: 'Assignee employee not found' });
      }

      const updated = await p.lead.update({
        where: { id: leadId },
        data: {
          assigned_to_id,
          assigned_at: new Date(),
          assignment_type: 'MANUAL_OVERRIDE',
          status: lead.status === 'NEW' ? 'ASSIGNED' : lead.status,
        },
      });

      // Write Lead Activity
      await p.leadActivity.create({
        data: {
          lead_id: leadId,
          actor_id: req.user!.employeeId,
          activity_type: 'ASSIGNED_TO_AGENT',
          notes: `Manual Reassignment to ${assignee.full_name || assignee.employee_code}. Reason: ${reason}`,
        },
      });

      // Write Audit Event
      await p.auditEvent.create({
        data: {
          actor_id: req.user!.employeeId,
          action: 'LEAD_MANUAL_REASSIGNMENT_OVERRIDE',
          entity_type: 'LEAD',
          entity_id: leadId,
          old_value: JSON.stringify({ assigned_to_id: lead.assigned_to_id }),
          new_value: JSON.stringify({ assigned_to_id, reason }),
        },
      });

      return res.status(200).json({
        message: `Lead ${lead.lead_code} reassigned to ${assignee.full_name || assignee.employee_code}`,
        lead: updated,
      });
    } catch (error: any) {
      console.error('Reassign lead error:', error);
      return res.status(500).json({ error: 'Failed to reassign lead' });
    }
  }
);

// PATCH /api/v1/leads/:id/status - Update lead status lifecycle
router.patch(
  '/:id/status',
  authenticateToken,
  validateRequestBody(LeadStatusUpdateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const leadId = parseInt(req.params.id, 10);
      const { status, notes } = req.body;

      const lead = await p.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      const updated = await p.lead.update({
        where: { id: leadId },
        data: {
          status,
          last_contacted_at: new Date(),
        },
      });

      await p.leadActivity.create({
        data: {
          lead_id: leadId,
          actor_id: req.user!.employeeId,
          activity_type: 'STATUS_CHANGED',
          notes: `Status updated from ${lead.status} to ${status}${notes ? `: ${notes}` : ''}`,
        },
      });

      return res.status(200).json({
        message: `Lead ${lead.lead_code} status updated to ${status}`,
        lead: updated,
      });
    } catch (error: any) {
      console.error('Update lead status error:', error);
      return res.status(500).json({ error: 'Failed to update lead status' });
    }
  }
);

// GET /api/v1/leads/:id/matches - Auto-Matching Engine endpoint
router.get('/:id/matches', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leadId = parseInt(req.params.id, 10);
    const matches = await findMatchingPropertiesForLead(leadId);
    return res.status(200).json({ matches });
  } catch (error: any) {
    console.error('Lead matches error:', error);
    return res.status(500).json({ error: 'Failed to find matching properties for lead' });
  }
});

// POST /api/v1/leads/:id/whatsapp-proposal/:propertyId - Send WhatsApp Proposal Payload & Log Activity
router.post('/:id/whatsapp-proposal/:propertyId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leadId = parseInt(req.params.id, 10);
    const propertyId = parseInt(req.params.propertyId, 10);
    const employeeId = req.user?.employeeId || (req.user as any)?.userId || (req.user as any)?.id || 1;

    const lead = await p.lead.findUnique({
      where: { id: leadId },
      include: { assigned_to: true },
    });
    const property = await p.property.findUnique({ where: { id: propertyId } });

    if (!lead || !property) {
      return res.status(404).json({ error: 'Lead or property not found' });
    }

    const text = generateWhatsAppText(lead, property, lead.assigned_to);
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const whatsAppUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(text)}`;

    // Log Activity
    await p.leadActivity.create({
      data: {
        lead_id: leadId,
        actor_id: employeeId,
        activity_type: 'WHATSAPP_PROPOSAL_SENT',
        notes: `WhatsApp Proposal sent for Property ${property.property_code} (${property.title})`,
      },
    });

    return res.status(200).json({
      message: 'WhatsApp proposal generated',
      whatsAppUrl,
      whatsAppText: text,
    });
  } catch (error: any) {
    console.error('WhatsApp proposal error:', error);
    return res.status(500).json({ error: 'Failed to generate WhatsApp proposal' });
  }
});

export default router;
