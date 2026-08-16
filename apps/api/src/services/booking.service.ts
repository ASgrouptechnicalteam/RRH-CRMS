// IMPORTANT: This file has been modified for Phase 12 Packet 12-1 attribution propagation.
// The following changes were made:
// - Added source/campaign/utm_* propagation from Opportunity to Booking
// - All other existing functionality is preserved

import { PrismaClient, Opportunity, Prisma } from '@prisma/client';
import { TokenPayload } from '../utils/jwt';
import { OpportunityPolicy } from '../policies/opportunity.policy';
import { AppError } from './lead.service'; // Resuse AppError
import { WorkflowEngine } from '../workflows/workflowEngine';
import { WorkflowDomain } from '../workflows/types';
import { CustomerService } from './customer.service';
import { BookingService } from './booking.service';

const prisma = new PrismaClient();
const p = prisma as any;

export class OpportunityService {
  /**
   * 1. Create an Opportunity from a Lead.
   */
  static async createFromLead(user: TokenPayload, data: {
    lead_id: number;
    owner_id?: number;
    project_id?: number;
    property_id?: number;
    expected_value?: number;
    probability?: number;
    budget_min?: number;
    budget_max?: number;
  }) {
    const { lead_id, project_id, property_id, ...opportunityData } = data;
    const owner_id = data.owner_id || user.employeeId;

    // 1. Validate Lead and Company Association
    const lead = await prisma.lead.findUnique({ where: { id: lead_id } });
    if (!lead || lead.company_id !== user.companyId) {
      throw new AppError(403, 'Cross-company access or Lead not found');
    }

    // Check if user has permission to mutate this Lead
    // Typically verified by LeadPolicy, but for now we enforce company boundary strictly
    
    // 2. Validate Owner (Employee)
    const owner = await prisma.employee.findUnique({ where: { id: owner_id } });
    if (!owner || owner.company_id !== user.companyId) {
      throw new AppError(403, 'Cross-company Owner assignment not allowed');
    }

    // 3. Validate Project (if provided)
    if (project_id) {
      const project = await prisma.project.findUnique({ where: { id: project_id } });
      if (!project || project.company_id !== user.companyId) {
        throw new AppError(403, 'Cross-company Project association not allowed');
      }
    }

    // 4. Validate Property (if provided)
    if (property_id) {
      const property = await prisma.property.findUnique({ where: { id: property_id }, include: { project: true } });
      if (!property || property.company_id !== user.companyId) {
        throw new AppError(403, 'Cross-company Property association not allowed');
      }
      
      // Ensure property and project match if both are provided
      if (project_id && property.project_id !== project_id) {
        throw new AppError(400, 'Property does not belong to the specified Project');
      }
    }

    // Proceed to create Opportunity within a transaction to also update Lead status and create History
    const result = await prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.create({
        data: {
          company_id: user.companyId,
          opportunity_code: `OPP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          lead_id: lead_id,
          source: lead.source,
          campaign: lead.campaign,
          utm_source: lead.utm_source,
          utm_medium: lead.utm_medium,
          utm_campaign: lead.utm_campaign,
          owner_id: owner_id,
          project_id: project_id,
          property_id: property_id,
          stage: 'PROSPECT_QUALIFIED', // Default initial stage
          expected_value: opportunityData.expected_value || 0,
          probability: opportunityData.probability || 10,
          budget_min: opportunityData.budget_min,
          budget_max: opportunityData.budget_max,
          history: {
            create: {
              from_stage: 'NONE',
              to_stage: 'PROSPECT_QUALIFIED',
              changed_by_id: user.employeeId,
            }
          }
        },
      });

      // Update Lead Status to OPPORTUNITY_OPEN if appropriate (e.g. not WON/LOST/CLOSED/NEGOTIATION already)
      // Assuming Lead status enum includes OPPORTUNITY_OPEN based on user prompt
      if (!['WON', 'LOST', 'OPPORTUNITY_OPEN', 'NEGOTIATION'].includes(lead.status)) {
        await tx.lead.update({
          where: { id: lead_id },
          data: { status: 'OPPORTUNITY_OPEN' }
        });
      }

      return opportunity;
    });

    return result;
  }

  /**
   * 2. Update Opportunity Commercial Fields
   */
  static async updateOpportunity(user: TokenPayload, id: number, data: {
    project_id?: number;
    property_id?: number;
    expected_value?: number;
    probability?: number;
    budget_min?: number;
    budget_max?: number;
    expected_close_date?: Date;
  }) {
    const opp = await prisma.opportunity.findUnique({ where: { id } });
    if (!opp) throw new AppError(404, 'Opportunity not found');

    if (!OpportunityPolicy.canMutate(user, opp)) {
      throw new AppError(403, 'Unauthorized to update this Opportunity');
    }

    // Validate Project
    if (data.project_id) {
      const project = await prisma.project.findUnique({ where: { id: data.project_id } });
      if (!project || project.company_id !== user.companyId) {
        throw new AppError(403, 'Cross-company Project association not allowed');
      }
    }

    // Validate Property
    if (property_id) {
      const property = await prisma.property.findUnique({ where: { id: data.property_id }, include: { project: true } });
      if (!property || property.company_id !== user.companyId) {
        throw new AppError(403, 'Cross-company Property association not allowed');
      }
    }

    return await prisma.opportunity.update({
      where: { id },
      data: {
        project_id: data.project_id,
        property_id: data.property_id,
        expected_value: data.expected_value,
        probability: data.probability,
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        expected_close_date: data.expected_close_date,
      },
    });
  }

  /**
   * Get all Opportunities for a given Lead, enforcing company isolation.
   */
  static async getOpportunitiesByLead(user: TokenPayload, lead_id: number) {
    const opps = await prisma.opportunity.findMany({
      where: {
        lead_id,
        company_id: user.companyId
      },
      include: {
        project: { select: { id: true, name: true } },
        property: { select: { id: true, title: true, property_code: true } },
        owner: { select: { id: true, full_name: true, employee_code: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    // Check visibility via OpportunityPolicy
    return opps.filter(opp => OpportunityPolicy.canView(opp as any));
  }

  /**
   * 3. Update Opportunity Stage (Workflow Engine Integration)
   * Passes the full entity with relations to the workflow for business invariant enforcement.
   * Stamps exited_at on the previous history record when leaving a stage.
   */
  static async updateStage(user: TokenPayload, id: number, newStage: string, dropReason?: string) {
    const opp = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        site_visits: true,
      },
    });
    if (!opp) throw new AppError(404, 'Opportunity not found');

    if (!OpportunityPolicy.canChangeStage(user, opp)) {
      throw new AppError(403, 'Unauthorized to change stage for this Opportunity');
    }

    // Build entity context for workflow invariant checks
    const entityContext = {
      ...opp,
      drop_reason: dropReason,
    };

    const transitionReq = {
      domain: WorkflowDomain.OPPORTUNITY,
      currentState: opp.stage,
      action: newStage,
      actor: user,
      entity: entityContext,
    };

    const transitionRes = WorkflowEngine.canTransition(transitionReq);

    if (!transitionRes.allowed) {
      throw new AppError(409, transitionRes.reason || 'Workflow transition denied');
    }

    const finalStage = transitionRes.nextState || newStage;
    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      // Stamp exited_at on the most recent history record for the current stage
      const lastHistory = await tx.opportunityHistory.findFirst({
        where: {
          opportunity_id: opp.id,
          to_stage: opp.stage,
          exited_at: null,
        },
        orderBy: { created_at: 'desc' },
      });

      if (lastHistory) {
        await tx.opportunityHistory.update({
          where: { id: lastHistory.id },
          data: { exited_at: now },
        });
      }

      const updatedOpp = await tx.opportunity.update({
        where: { id },
        data: {
          stage: finalStage,
          drop_reason: finalStage === 'DROPPED' ? dropReason : opp.drop_reason,
        },
      });

      await tx.opportunityHistory.create({
        data: {
          opportunity_id: opp.id,
          from_stage: opp.stage,
          to_stage: finalStage,
          changed_by_id: user.employeeId,
        },
      });

      return updatedOpp;
    });
  }

  /**
   * 4. List Opportunities with Company Scope, Filtering, Sorting, and Pagination
   */
  static async getOpportunities(user: TokenPayload, filters: {
    stage?: string;
    owner_id?: string | number;
    project_id?: string | number;
    property_id?: string | number;
    date_from?: string;
    date_to?: string;
    expected_close_from?: string;
    expected_close_to?: string;
    sort_by?: string;
    sort_order?: string;
    limit?: string | number;
    offset?: string | number;
  } = {}) {
    const policyWhere = OpportunityPolicy.canList(user);
    
    const where: any = {
      AND: [
        policyWhere
      ]
    };

    if (filters.stage) where.AND.push({ stage: filters.stage });
    if (filters.owner_id) where.AND.push({ owner_id: Number(filters.owner_id) });
    if (filters.project_id) where.AND.push({ project_id: Number(filters.project_id) });
    if (filters.property_id) where.AND.push({ property_id: Number(filters.property_id) });

    // Date range filters
    if (filters.date_from || filters.date_to) {
      const dateFilter: any = {};
      if (filters.date_from) dateFilter.gte = new Date(filters.date_from);
      if (filters.date_to) dateFilter.lte = new Date(filters.date_to);
      where.AND.push({ created_at: dateFilter });
    }

    if (filters.expected_close_from || filters.expected_close_to) {
      const closeFilter: any = {};
      if (filters.expected_close_from) closeFilter.gte = new Date(filters.expected_close_from);
      if (filters.expected_close_to) closeFilter.lte = new Date(filters.expected_close_to);
      where.AND.push({ expected_close_date: closeFilter });
    }

    // Sorting
    const allowedSortFields = ['created_at', 'updated_at', 'expected_value', 'probability', 'expected_close_date', 'stage'];
    const sortBy = allowedSortFields.includes(filters.sort_by || '') ? filters.sort_by! : 'updated_at';
    const sortOrder = filters.sort_order === 'asc' ? 'asc' : 'desc';

    // Pagination
    const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200);
    const offset = Math.max(Number(filters.offset) || 0, 0);

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        include: {
          lead: { select: { id: true, customer_name: true, phone: true } },
          owner: { select: { id: true, full_name: true, employee_code: true } },
          project: { select: { id: true, name: true } },
          property: { select: { id: true, title: true, property_code: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.opportunity.count({ where }),
    ]);

    return { opportunities, total, limit, offset };
  }

  /**
   * 3b. Get Opportunity Stage History with computed duration
   */
  static async getOpportunityHistory(user: TokenPayload, opportunityId: number) {
    const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opp) throw new AppError(404, 'Opportunity not found');

    if (!OpportunityPolicy.canView(opp as any)) {
      throw new AppError(403, 'Unauthorized to view this Opportunity history');
    }

    const history = await prisma.opportunityHistory.findMany({
      where: { opportunity_id: opportunityId },
      include: {
        changed_by: { select: { id: true, full_name: true, employee_code: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    // Compute duration_minutes from timestamps (exited_at - created_at)
    return history.map((h) => {
      const durationMs = h.exited_at
        ? new Date(h.exited_at).getTime() - new Date(h.created_at).getTime()
        : null;
      const durationMinutes = durationMs !== null ? Math.round(durationMs / 60000) : null;
      return {
        ...h,
        duration_minutes: durationMinutes,
      };
    });
  }

  /**
   * 5. Get Single Opportunity Dossier
   */
  static async getOpportunityById(user: TokenPayload, id: number) {
    const opp = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        lead: true,
        owner: { select: { id: true, full_name: true, employee_code: true } },
        project: true,
        property: true,
        history: {
          orderBy: { created_at: 'desc' },
          include: { changed_by: { select: { full_name: true } } }
        },
        tasks: true,
        site_visits: true
      }
    });

    if (!opp) throw new AppError(404, 'Opportunity not found');

    if (!OpportunityPolicy.canView(opp as any)) {
      throw new AppError(403, 'Unauthorized to view this Opportunity');
    }

    return opp;
  }

  /**
   * 6. Comprehensive Pipeline Metrics (Company + Policy Scoped)
   */
  static async getPipelineMetrics(user: TokenPayload) {
    const policyWhere = OpportunityPolicy.canList(user);

    // Fetch all opportunities the user can see (scoped at DB level)
    const allOpps = await prisma.opportunity.findMany({
      where: policyWhere,
      select: {
        id: true,
        stage: true,
        expected_value: true,
        probability: true,
        drop_reason: true,
        owner_id: true,
        project_id: true,
        property_id: true,
        created_at: true,
        owner: { select: { id: true, full_name: true } },
        project: { select: { id: true, name: true } },
        property: { select: { id: true, title: true } },
      },
    });

    const TERMINAL_STAGES = ['BOOKED', 'DROPPED'];
    const activeOpps = allOpps.filter(o => !TERMINAL_STAGES.includes(o.stage));
    const now = Date.now();

    // --- Count by stage ---
    const countByStage: Record<string, number> = {};
    allOpps.forEach(o => {
      countByStage[o.stage] = (countByStage[o.stage] || 0) + 1;
    });

    // --- Pipeline values ---
    let totalExpectedValue = 0;
    let totalWeightedValue = 0;
    activeOpps.forEach(o => {
      const val = Number(o.expected_value || 0);
      const prob = Number(o.probability || 0);
      totalExpectedValue += val;
      totalWeightedValue += val * (prob / 100);
    });

    // --- Owner segmentation ---
    const ownerMap = new Map<number, { name: string; count: number; value: number; weighted: number }>();
    activeOpps.forEach(o => {
      const entry = ownerMap.get(o.owner_id) || { name: o.owner?.full_name || 'Unknown', count: 0, value: 0, weighted: 0 };
      entry.count++;
      entry.value += Number(o.expected_value || 0);
      entry.weighted += Number(o.expected_value || 0) * Number(o.probability || 0) / 100;
      ownerMap.set(o.owner_id, entry);
    });

    // --- Project segmentation ---
    const projectMap = new Map<number, { name: string; count: number; value: number }>();
    activeOpps.filter(o => o.project_id).forEach(o => {
      const entry = projectMap.get(o.project_id!) || { name: o.project?.name || 'Unknown', count: 0, value: 0 };
      entry.count++;
      entry.value += Number(o.expected_value || 0);
      projectMap.set(o.project_id!, entry);
    });

    // --- Property segmentation ---
    const propertyMap = new Map<number, { title: string; count: number; value: number }>();
    activeOpps.filter(o => o.property_id).forEach(o => {
      const entry = propertyMap.get(o.property_id!) || { title: o.property?.title || 'Unknown', count: 0, value: 0 };
      entry.count++;
      entry.value += Number(o.expected_value || 0);
      propertyMap.set(o.property_id!, entry);
    });

    // --- Terminal states ---
    const droppedOpps = allOpps.filter(o => o.stage === 'DROPPED');
    const droppedReasons: Record<string, number> = {};
    droppedOpps.forEach(o => {
      const reason = o.drop_reason || 'No reason provided';
      droppedReasons[reason] = (droppedReasons[reason] || 0) + 1;
    });

    const bookingInitiatedCount = allOpps.filter(o => o.stage === 'BOOKING_INITIATED').length;
    const bookedCount = allOpps.filter(o => o.stage === 'BOOKED').length;

    // --- Opportunity age ---
    const ages = activeOpps.map(o => Math.round((now - new Date(o.created_at).getTime()) / 86400000));
    const avgAgeDays = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    return {
      activeCount: activeOpps.length,
      totalCount: allOpps.length,
      totalExpectedValue,
      totalWeightedValue,
      countByStage,
      byOwner: Array.from(ownerMap.entries()).map(([id, d]) => ({ owner_id: id, ...d })),
      byProject: Array.from(projectMap.entries()).map(([id, d]) => ({ project_id: id, ...d })),
      byProperty: Array.from(propertyMap.entries()).map(([id, d]) => ({ property_id: id, ...d })),
      droppedCount: droppedOpps.length,
      droppedReasons,
      bookingInitiatedCount,
      bookedCount,
      avgAgeDays,
    };
  }

  /**
   * Phase 9 Packet 3 - Opportunity -> Customer -> Booking Integration
   * Convert an Opportunity into a Booking atomically.
   */
  static async convertToBooking(user: TokenPayload, opportunityId: number, dto: any) {
    // 1. Verify Opportunity exists and is accessible
    const opp = await prisma.opportunity.findUnique({
      where: { id: opportunityId, company_id: user.companyId },
      include: { property: true }
    });

    if (!opp) {
      throw new AppError(404, 'Opportunity not found or access denied');
    }

    if (!OpportunityPolicy.canMutate(user, opp)) {
      throw new AppError(403, 'Unauthorized to convert this Opportunity');
    }

    // 2. Validate Stage
    if (opp.stage !== 'BOOKING_INITIATED') {
      throw new AppError(400, 'Opportunity must be in BOOKING_INITIATED stage to convert to booking');
    }

    // 3. Check existing booking (Idempotency)
    if (opp.booking_id) {
      const existingBooking = await BookingService.getBookingById(user, opp.booking_id);
      return existingBooking; // safely return existing booking
    }

    if (!opp.property_id) {
      throw new AppError(400, 'Opportunity must have a property assigned before booking');
    }

    // 4. Atomic Transaction Envelope
    return await prisma.$transaction(async (tx) => {
      // Step A: Resolve Customer
      const customer = await CustomerService.upsertFromLead(user, opp.lead_id, tx);

      // Step B: Create Booking (with Packet 2 property lock)
      const bookingDto = {
        ...dto,
        customer_id: customer.id,
        property_id: opp.property_id,
        source: opp.source,
        campaign: opp.campaign,
        utm_source: opp.utm_source,
        utm_medium: opp.utm_medium,
        utm_campaign: opp.utm_campaign,
      };
      
      const booking = await BookingService.createBooking(user, bookingDto, tx);

      // Step C: Atomically link Booking to Opportunity
      const oppUpdate = await tx.opportunity.updateMany({
        where: { id: opportunityId, booking_id: null },
        data: { booking_id: booking.id }
      });

      if (oppUpdate.count === 0) {
        // Another concurrent request beat us to it
        throw new AppError(409, 'Opportunity has already been converted to a booking');
      }

      return booking;
    });
  }
}