import { PrismaClient, Lead, Prisma } from '@prisma/client';
import { TokenPayload } from '../utils/jwt';
import { Roles } from '@rrh-ems/shared';
import { can } from '../authz/authorization';
import { Permissions } from '@rrh-ems/shared';
import { WorkflowEngine } from '../workflows/workflowEngine';
import { WorkflowDomain } from '../workflows/types';
import { findBestAssigneeForLead } from '../utils/distributionService';
import { generateWhatsAppText } from '../utils/matchingEngine';
import { buildLeadScope } from '../authz/dataScope';

const prisma = new PrismaClient();
const p = prisma as any;

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class LeadService {
  /**
   * Helper to generate sequential static lead code: RRH-LD-YYYY-XXXX
   */
  private static async generateNextLeadCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await p.lead.count();
    const sequentialNum = (count + 1).toString().padStart(4, '0');
    return `RRH-LD-${currentYear}-${sequentialNum}`;
  }

  static async getLeads(user: TokenPayload) {
    const whereCondition = await buildLeadScope(user);

    return await p.lead.findMany({
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
  }

  static async getDistributionMonitor(companyId: number) {
    const telecallers = await p.employee.findMany({
      where: {
        company_id: companyId,
        status: 'ACTIVE',
        roles: {
          some: { role: { name: Roles.TELECALLER } },
        },
      },
      select: { id: true, employee_code: true, full_name: true, department: true },
    });

    // Instead of N+1 queries, use grouping
    const activeLeadCounts = await p.lead.groupBy({
      by: ['assigned_to_id'],
      where: {
        company_id: companyId,
        assigned_to_id: { in: telecallers.map((t: any) => t.id) },
        status: { in: ['NEW', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'SITE_VISIT_SCHEDULED'] },
      },
      _count: { _all: true },
    });

    const totalAssignedCounts = await p.lead.groupBy({
      by: ['assigned_to_id'],
      where: { company_id: companyId, assigned_to_id: { in: telecallers.map((t: any) => t.id) } },
      _count: { _all: true },
    });

    const totalWonCounts = await p.lead.groupBy({
      by: ['assigned_to_id'],
      where: { company_id: companyId, status: 'WON', assigned_to_id: { in: telecallers.map((t: any) => t.id) } },
      _count: { _all: true },
    });

    const activeMap = new Map(activeLeadCounts.map((x: any) => [x.assigned_to_id, x._count._all]));
    const assignedMap = new Map(totalAssignedCounts.map((x: any) => [x.assigned_to_id, x._count._all]));
    const wonMap = new Map(totalWonCounts.map((x: any) => [x.assigned_to_id, x._count._all]));

    const monitorData = telecallers.map((emp: any) => {
      const activeLeadCount = Number(activeMap.get(emp.id) || 0);
      const totalAssigned = Number(assignedMap.get(emp.id) || 0);
      const totalWon = Number(wonMap.get(emp.id) || 0);

      return {
        id: emp.id,
        employeeCode: emp.employee_code,
        fullName: emp.full_name || emp.employee_code,
        activeLeadCount,
        totalAssigned,
        totalWon,
        closureRate: totalAssigned > 0 ? ((totalWon / totalAssigned) * 100).toFixed(1) + '%' : '0.0%',
      };
    });

    const totalLeadsCount = await p.lead.count({ where: { company_id: companyId } });
    const unassignedCount = await p.lead.count({
      where: { company_id: companyId, assigned_to_id: null },
    });

    return { totalLeadsCount, unassignedCount, telecallers: monitorData };
  }

  static async createLead(user: TokenPayload, dto: any) {
    const leadCode = await this.generateNextLeadCode();
    const bestAssignee = await findBestAssigneeForLead(user.companyId);

    return await p.$transaction(async (tx: any) => {
      const lead = await tx.lead.create({
        data: {
          lead_code: leadCode,
          company_id: user.companyId,
          branch_id: user.branchId || null,
          customer_name: dto.customer_name,
          phone: dto.phone,
          email: dto.email || null,
          source: dto.source || 'MANUAL_ENTRY',
          status: bestAssignee ? 'ASSIGNED' : 'NEW',
          assigned_to_id: bestAssignee ? bestAssignee.employeeId : null,
          assigned_at: bestAssignee ? new Date() : null,
          assignment_type: bestAssignee ? 'PERFORMANCE_WEIGHTED' : null,
          property_type_preference: dto.property_type_preference || null,
          budget_min: dto.budget_min || null,
          budget_max: dto.budget_max || null,
          preferred_location: dto.preferred_location || null,
          notes: dto.notes || null,
          created_by_id: user.employeeId,
        },
      });

      await tx.leadActivity.create({
        data: {
          lead_id: lead.id,
          actor_id: user.employeeId,
          activity_type: 'LEAD_CREATED',
          notes: `Lead ${lead.lead_code} registered via ${lead.source}`,
        },
      });

      if (bestAssignee) {
        await tx.leadActivity.create({
          data: {
            lead_id: lead.id,
            actor_id: user.employeeId,
            activity_type: 'ASSIGNED_TO_AGENT',
            notes: `Auto-distributed to ${bestAssignee.name} (${bestAssignee.employeeCode}) [Weight Score: ${bestAssignee.weight.toFixed(1)}]`,
          },
        });

        await tx.notification.create({
          data: {
            employee_id: bestAssignee.employeeId,
            type: 'TARGET_ASSIGNED',
            title: 'New Lead Auto-Assigned',
            message: `New Lead ${lead.customer_name} (${lead.phone}) has been assigned to you.`,
          },
        });
      }

      return { lead, assignedTo: bestAssignee };
    });
  }

  static async bulkUploadLeads(user: TokenPayload, rawLeads: any[]) {
    let insertedCount = 0;
    const createdLeads = [];

    // Chunking to prevent holding transaction too long
    const CHUNK_SIZE = 50;
    for (let i = 0; i < rawLeads.length; i += CHUNK_SIZE) {
      const chunk = rawLeads.slice(i, i + CHUNK_SIZE);

      await p.$transaction(async (tx: any) => {
        for (const item of chunk) {
          if (!item.customer_name || !item.phone) continue;

          const leadCode = await this.generateNextLeadCode(); // Inside transaction to ensure unique code sequentially
          const bestAssignee = await findBestAssigneeForLead(user.companyId);

          const newLead = await tx.lead.create({
            data: {
              lead_code: leadCode,
              company_id: user.companyId,
              branch_id: user.branchId || null,
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
              created_by_id: user.employeeId,
            },
          });

          await tx.leadActivity.create({
            data: {
              lead_id: newLead.id,
              actor_id: user.employeeId,
              activity_type: 'LEAD_CREATED',
              notes: `Bulk Upload Lead ${newLead.lead_code} created by Digital Lead Operator`,
            },
          });

          if (bestAssignee) {
            await tx.leadActivity.create({
              data: {
                lead_id: newLead.id,
                actor_id: user.employeeId,
                activity_type: 'ASSIGNED_TO_AGENT',
                notes: `Weighted Auto-Distribution to ${bestAssignee.name} (${bestAssignee.employeeCode})`,
              },
            });
          }

          insertedCount++;
          createdLeads.push(newLead);
        }
      });
    }

    return { count: insertedCount };
  }

  static async reassignLead(user: TokenPayload, leadId: number, assigneeId: number, reason: string) {
    const lead = await p.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new AppError(404, 'Lead not found');

    if (!can(user, Permissions.LEADS_ASSIGN, lead)) {
      throw new AppError(403, 'Forbidden: Insufficient privileges or cross-company reassignment');
    }

    const assignee = await p.employee.findUnique({ where: { id: assigneeId } });
    if (!assignee) throw new AppError(404, 'Assignee employee not found');

    return await p.$transaction(async (tx: any) => {
      const updated = await tx.lead.update({
        where: { id: leadId },
        data: {
          assigned_to_id: assigneeId,
          assigned_at: new Date(),
          assignment_type: 'MANUAL_OVERRIDE',
          status: lead.status === 'NEW' ? 'ASSIGNED' : lead.status,
        },
      });

      await tx.leadActivity.create({
        data: {
          lead_id: leadId,
          actor_id: user.employeeId,
          activity_type: 'ASSIGNED_TO_AGENT',
          notes: `Manual Reassignment to ${assignee.full_name || assignee.employee_code}. Reason: ${reason}`,
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_id: user.employeeId,
          action: 'LEAD_MANUAL_REASSIGNMENT_OVERRIDE',
          entity_type: 'LEAD',
          entity_id: leadId,
          old_value: JSON.stringify({ assigned_to_id: lead.assigned_to_id }),
          new_value: JSON.stringify({ assigned_to_id: assigneeId, reason }),
        },
      });

      return updated;
    });
  }

  static async updateLeadStatus(user: TokenPayload, leadId: number, newStatus: string, notes?: string) {
    const lead = await p.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new AppError(404, 'Lead not found');

    if (!can(user, Permissions.LEADS_UPDATE, lead)) {
      throw new AppError(403, 'Forbidden: You do not have permission to mutate this lead');
    }

    const transition = WorkflowEngine.canTransition({
      domain: WorkflowDomain.LEAD,
      currentState: lead.status,
      action: newStatus,
      actor: user,
      entity: lead,
    });

    if (!transition.allowed) {
      throw new AppError(409, transition.reason || 'Invalid state transition');
    }

    return await p.$transaction(async (tx: any) => {
      const updated = await tx.lead.update({
        where: { id: leadId },
        data: {
          status: newStatus,
          last_contacted_at: new Date(),
        },
      });

      await tx.leadActivity.create({
        data: {
          lead_id: leadId,
          actor_id: user.employeeId,
          activity_type: 'STATUS_CHANGED',
          notes: `Status updated from ${lead.status} to ${newStatus}${notes ? `: ${notes}` : ''}`,
        },
      });

      return updated;
    });
  }

  static async getMatches(user: TokenPayload, leadId: number) {
    const lead = await p.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new AppError(404, 'Lead not found');

    if (!can(user, Permissions.LEADS_READ, lead)) {
      throw new AppError(403, 'Forbidden: You do not have permission to view matches for this lead');
    }

    // Call the matching engine (defined in matchingEngine.ts)
    // Note: To avoid circular imports or redefining the engine here, we imported it at the top.
    // However, findMatchingPropertiesForLead requires leadId.
    const { findMatchingPropertiesForLead } = require('../utils/matchingEngine');
    const matches = await findMatchingPropertiesForLead(leadId);
    return matches;
  }

  static async sendWhatsAppProposal(user: TokenPayload, leadId: number, propertyId: number) {
    const lead = await p.lead.findUnique({
      where: { id: leadId },
      include: { assigned_to: true },
    });
    if (!lead) throw new AppError(404, 'Lead not found');

    if (!can(user, Permissions.LEADS_UPDATE, lead)) {
      throw new AppError(403, 'Forbidden: You do not have permission to propose properties to this lead');
    }

    const property = await p.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new AppError(404, 'Property not found');

    const text = generateWhatsAppText(lead, property, lead.assigned_to);
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const whatsAppUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(text)}`;

    await p.leadActivity.create({
      data: {
        lead_id: leadId,
        actor_id: user.employeeId,
        activity_type: 'WHATSAPP_PROPOSAL_SENT',
        notes: `WhatsApp Proposal sent for Property ${property.property_code} (${property.title})`,
      },
    });

    return { whatsAppUrl, whatsAppText: text };
  }

  static async addPropertyInterest(user: TokenPayload, leadId: number, propertyId: number) {
    const lead = await p.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new AppError(404, 'Lead not found');

    if (!can(user, Permissions.LEADS_UPDATE, lead)) {
      throw new AppError(403, 'Forbidden: You do not have permission to modify this lead');
    }

    const property = await p.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new AppError(404, 'Property not found');

    if (lead.company_id !== property.company_id) {
      throw new AppError(400, 'Invalid relation: Lead and Property belong to different companies');
    }

    return await p.$transaction(async (tx: any) => {
      const interest = await tx.leadPropertyInterest.upsert({
        where: {
          lead_id_property_id: {
            lead_id: leadId,
            property_id: propertyId,
          }
        },
        update: { is_active: true },
        create: {
          lead_id: leadId,
          property_id: propertyId,
          created_by: user.employeeId,
        }
      });

      await tx.leadActivity.create({
        data: {
          lead_id: leadId,
          actor_id: user.employeeId,
          activity_type: 'PROPERTY_INTEREST_ADDED',
          notes: `Added interest in Property ${property.property_code} (${property.title})`,
        }
      });

      return interest;
    });
  }

  static async removePropertyInterest(user: TokenPayload, leadId: number, propertyId: number) {
    const lead = await p.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new AppError(404, 'Lead not found');

    if (!can(user, Permissions.LEADS_UPDATE, lead)) {
      throw new AppError(403, 'Forbidden: You do not have permission to modify this lead');
    }

    const interest = await p.leadPropertyInterest.findUnique({
      where: { lead_id_property_id: { lead_id: leadId, property_id: propertyId } },
      include: { property: true }
    });

    if (!interest) {
      throw new AppError(404, 'Property interest not found');
    }

    return await p.$transaction(async (tx: any) => {
      await tx.leadPropertyInterest.update({
        where: { id: interest.id },
        data: { is_active: false }
      });

      await tx.leadActivity.create({
        data: {
          lead_id: leadId,
          actor_id: user.employeeId,
          activity_type: 'PROPERTY_INTEREST_REMOVED',
          notes: `Removed interest in Property ${interest.property.property_code} (${interest.property.title})`,
        }
      });

      return { success: true, message: 'Property interest removed successfully' };
    });
  }

  static async getPropertyInterests(user: TokenPayload, leadId: number) {
    const lead = await p.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new AppError(404, 'Lead not found');

    if (!can(user, Permissions.LEADS_READ, lead)) {
      throw new AppError(403, 'Forbidden: You do not have permission to read this lead');
    }

    const interests = await p.leadPropertyInterest.findMany({
      where: { lead_id: leadId, is_active: true },
      include: {
        property: {
          select: {
            id: true,
            property_code: true,
            title: true,
            location: true,
            price: true,
            status: true,
            assigned_pm: { select: { id: true, full_name: true } }
          }
        },
        creator: { select: { id: true, full_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    return interests;
  }
}
