import { PrismaClient, SiteVisitBooking, Lead } from '@prisma/client';
import { TokenPayload } from '../utils/jwt';
import { Roles } from '@rrh-ems/shared';
import { can } from '../authz/authorization';
import { Permissions } from '@rrh-ems/shared';
import { WorkflowEngine } from '../workflows/workflowEngine';
import { WorkflowDomain } from '../workflows/types';
import { SiteVisitAction } from '../workflows/siteVisit.workflow';
import { SiteVisitPolicy } from '../policies/siteVisit.policy';

const prisma = new PrismaClient();
const p = prisma as any;

export class SiteVisitService {
  private static async generateNextBookingCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await p.siteVisitBooking.count();
    const seq = (count + 1).toString().padStart(4, '0');
    return `RRH-SV-${currentYear}-${seq}`;
  }

  static async listVisits(user: TokenPayload, filters: { status?: string; leadId?: string }) {
    const whereCondition = SiteVisitPolicy.canList(user);

    if (filters.status) {
      whereCondition.status = filters.status;
    }
    if (filters.leadId) {
      whereCondition.lead_id = parseInt(filters.leadId, 10);
    }

    const visits = await p.siteVisitBooking.findMany({
      where: whereCondition,
      include: {
        lead: { select: { id: true, lead_code: true, customer_name: true, phone: true, preferred_location: true, company_id: true } },
        telecaller: { select: { id: true, employee_code: true, full_name: true, phone: true } },
        project_manager: { select: { id: true, employee_code: true, full_name: true, phone: true } },
        assigned_agent: { select: { id: true, employee_code: true, full_name: true, phone: true } },
        property: { select: { id: true, property_code: true, title: true, status: true } }
      },
      orderBy: { scheduled_date: 'asc' },
    });

    console.log('DEBUG LIST VISITS:', {
      user: { id: user.employeeId, companyId: user.companyId, roles: user.roles },
      whereCondition: JSON.stringify(whereCondition),
      returnedCount: visits.length,
      returnedVisits: visits.map((v: any) => ({
        visitId: v.id,
        leadCompanyId: v.lead?.company_id
      }))
    });

    return visits;
  }

  static async bookVisit(user: TokenPayload, data: any) {
    const lead = await p.lead.findUnique({ where: { id: data.lead_id } });
    if (!lead) {
      throw { status: 404, message: 'Lead not found' };
    }

    if (!can(user, Permissions.SITE_VISITS_CREATE, lead)) {
      throw { status: 403, message: 'Forbidden: Missing site_visits.create permission or Lead is not in your company' };
    }

    if (data.opportunity_id) {
      const opportunity = await p.opportunity.findUnique({ where: { id: data.opportunity_id } });
      if (!opportunity) {
        throw { status: 404, message: 'Opportunity not found' };
      }
      if (opportunity.company_id !== user.companyId) {
        throw { status: 403, message: 'Forbidden: Opportunity belongs to another company' };
      }
      if (opportunity.lead_id !== data.lead_id) {
        throw { status: 400, message: 'Opportunity does not belong to the specified Lead' };
      }
      // Note: If property_id is provided in data and opportunity has one, they don't strictly have to match,
      // but the property must belong to the same company (validated below).
    }

    const bookingCode = await this.generateNextBookingCode();

    // Auto-assign Project Manager based on Property
    let pmId = null;
    let pm = null;

    if (data.property_id) {
      const property = await p.property.findUnique({
        where: { id: data.property_id },
        include: { assigned_pm: true }
      });
      
      if (!property) {
        throw { status: 404, message: 'Property not found' };
      }

      if (lead.company_id !== property.company_id) {
        throw { status: 400, message: 'Invalid relation: Lead and Property belong to different companies' };
      }

      if (property?.assigned_pm && property.assigned_pm.status === 'ACTIVE') {
        pmId = property.assigned_pm_id;
        pm = property.assigned_pm;
      }
    }

    return await p.$transaction(async (tx: any) => {
      if (!pmId) {
        // Fallback: Notify MD
        const md = await tx.employee.findFirst({
          where: { roles: { some: { role: { name: Roles.MD } } }, company_id: user.companyId }
        });
        if (md) {
          await tx.notification.create({
            data: {
              employee: { connect: { id: md.id } },
              type: 'SYSTEM_ALERT',
              title: 'Unassigned Site Visit',
              message: `Site visit for Property ${data.property_id || 'Unknown'} has no active PM. Please reassign manually.`
            }
          });
        }
      }

      const bookingData: any = {
        booking_code: bookingCode,
        lead: { connect: { id: data.lead_id } },
        telecaller: { connect: { id: user.employeeId } },
        scheduled_date: new Date(data.scheduled_date),
        status: 'PENDING_VERIFICATION',
        verification_call_notes: data.notes || 'Booked by telecaller. Awaiting verification call.',
      };

      if (data.opportunity_id) {
        bookingData.opportunity = { connect: { id: data.opportunity_id } };
      }

      if (data.property_id) {
        bookingData.property = { connect: { id: data.property_id } };
      }

      if (pmId) {
        bookingData.project_manager = { connect: { id: pmId } };
      }

      const booking = await tx.siteVisitBooking.create({
        data: bookingData,
      });

      // Activity log
      await tx.leadActivity.create({
        data: {
          lead: { connect: { id: data.lead_id } },
          actor: { connect: { id: user.employeeId } },
          activity_type: 'SITE_VISIT_BOOKED',
          notes: `Site Visit ${booking.booking_code} booked for ${new Date(data.scheduled_date).toLocaleString()}. Assigned to PM ${pm ? pm.employee_code : 'Queue'}.`,
        },
      });

      return booking;
    });
  }

  static async verifyVisit(user: TokenPayload, visitId: number, confirmed: boolean, verification_notes?: string) {
    const visit = await p.siteVisitBooking.findUnique({
      where: { id: visitId },
      include: { lead: true }
    });

    if (!visit) {
      throw { status: 404, message: 'Site visit booking not found' };
    }

    if (!can(user, Permissions.SITE_VISITS_VERIFY, visit)) {
      throw { status: 403, message: 'Forbidden: Missing site_visits.verify permission or cross-company access denied' };
    }

    const transition = WorkflowEngine.canTransition({
      domain: WorkflowDomain.SITE_VISIT,
      currentState: visit.status,
      action: 'VERIFY',
      actor: user,
      entity: visit,
    });

    if (!transition.allowed) {
      throw { status: 409, message: transition.reason || 'Invalid state transition' };
    }

    const nextStatus = confirmed ? 'CONFIRMED' : 'CANCELLED';

    return await p.$transaction(async (tx: any) => {
      const updated = await tx.siteVisitBooking.update({
        where: { id: visitId },
        data: {
          status: nextStatus,
          verification_call_notes: verification_notes || 'Schedule verified by telecaller call.',
        },
      });

      if (confirmed) {
        await tx.lead.update({
          where: { id: visit.lead_id },
          data: { status: 'SITE_VISIT_SCHEDULED' },
        });
      }

      await tx.leadActivity.create({
        data: {
          lead: { connect: { id: visit.lead_id } },
          actor: { connect: { id: user.employeeId } },
          activity_type: 'SITE_VISIT_VERIFIED',
          notes: `Telecaller call verified site visit ${visit.booking_code}: ${nextStatus}. Notes: ${verification_notes || 'Confirmed'}`,
        },
      });

      return updated;
    });
  }

  static async assignAgent(user: TokenPayload, visitId: number, agentId: number, notes?: string) {
    const visit = await p.siteVisitBooking.findUnique({
      where: { id: visitId },
      include: { lead: true }
    });

    if (!visit) {
      throw { status: 404, message: 'Site visit booking not found' };
    }

    const agent = await p.employee.findUnique({ where: { id: agentId } });
    if (!agent) {
      throw { status: 404, message: 'Agent not found' };
    }

    if (!can(user, Permissions.SITE_VISITS_ASSIGN_AGENT, visit)) {
      throw { status: 403, message: 'Forbidden: Missing site_visits.assign_agent permission or cross-company access denied' };
    }

    const transition = WorkflowEngine.canTransition({
      domain: WorkflowDomain.SITE_VISIT,
      currentState: visit.status,
      action: 'ASSIGN_AGENT',
      actor: user,
      entity: visit,
    });

    if (!transition.allowed) {
      throw { status: 409, message: transition.reason || 'Invalid state transition' };
    }

    return await p.$transaction(async (tx: any) => {
      const updated = await tx.siteVisitBooking.update({
        where: { id: visitId },
        data: {
          assigned_agent: { connect: { id: agentId } },
          status: 'ASSIGNED_TO_AGENT',
        },
      });

      await tx.leadActivity.create({
        data: {
          lead: { connect: { id: visit.lead_id } },
          actor: { connect: { id: user.employeeId } },
          activity_type: 'AGENT_DISPATCHED_FOR_SITE_VISIT',
          notes: `PM assigned Field Agent ${agent.full_name} to conduct site visit ${visit.booking_code}.${notes ? ` Notes: ${notes}` : ''}`,
        },
      });

      return updated;
    });
  }

  static async completeVisit(user: TokenPayload, visitId: number, rating: string, feedback_notes?: string, proof_photo_url?: string) {
    const visit = await p.siteVisitBooking.findUnique({
      where: { id: visitId },
      include: { lead: true }
    });

    if (!visit) {
      throw { status: 404, message: 'Site visit booking not found' };
    }

    if (!can(user, Permissions.SITE_VISITS_COMPLETE, visit)) {
      throw { status: 403, message: 'Forbidden: Missing site_visits.complete permission or cross-company access denied' };
    }

    const transition = WorkflowEngine.canTransition({
      domain: WorkflowDomain.SITE_VISIT,
      currentState: visit.status,
      action: 'COMPLETE',
      actor: user,
      entity: visit,
    });

    if (!transition.allowed) {
      throw { status: 409, message: transition.reason || 'Invalid state transition' };
    }

    return await p.$transaction(async (tx: any) => {
      const updated = await tx.siteVisitBooking.update({
        where: { id: visitId },
        data: {
          status: 'COMPLETED',
          feedback_notes,
          rating: rating || 'HOT_INTERESTED',
          proof_photo_url: proof_photo_url || null,
          completed_at: new Date(),
        },
      });

      // Only update Lead.status if it's not already OPPORTUNITY_OPEN or WON
      if (!['WON', 'OPPORTUNITY_OPEN'].includes(visit.lead.status)) {
        const nextLeadStatus = rating === 'HOT_INTERESTED' ? 'QUALIFIED' : rating === 'WARM' ? 'NEGOTIATION' : 'CONTACTED';
        await tx.lead.update({
          where: { id: visit.lead_id },
          data: { status: nextLeadStatus },
        });
      }

      await tx.leadActivity.create({
        data: {
          lead: { connect: { id: visit.lead_id } },
          actor: { connect: { id: user.employeeId } },
          activity_type: 'SITE_VISIT_COMPLETED',
          notes: `Site Visit Completed! Rating: ${rating}. Feedback: ${feedback_notes}${proof_photo_url ? ' (Proof Photo Uploaded)' : ''}`,
        },
      });

      return updated;
    });
  }
}
