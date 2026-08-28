import { LeadStatus } from '@rrh-ems/shared';
import { DomainWorkflow, WorkflowTransitionRequest, WorkflowTransitionResult } from './types';

/**
 * Lead Macro-Status Workflow State Machine (docs/LEAD-WORKFLOW-SPEC.md §1)
 *
 * The workflow engine is the single authority permitted to write `Lead.status`.
 * Services MUST route every lead status change through
 * WorkflowEngine.canTransition(...) and never issue a raw
 * `tx.lead.update({ status })`.
 *
 * This engine enforces BOTH:
 *  - the allowed state graph (transitionMatrix), and
 *  - the spec's field-level guards (e.g. `exit_reason` required for DROPPED,
 *    `demo_scheduled_at` + `demo_handler_id` required for DEMO_SCHEDULED,
 *    at least one SiteVisitBooking for SITE_VISIT_SCHEDULED/COMPLETED).
 */
export class LeadWorkflow implements DomainWorkflow {
  private static readonly DROPPABLE_FROM = new Set<string>([
    LeadStatus.ASSIGNED,
    LeadStatus.CONTACTED,
    LeadStatus.QUALIFICATION_PENDING,
    LeadStatus.QUALIFIED,
    LeadStatus.DEMO_SCHEDULED,
    LeadStatus.DEMO_COMPLETED,
    LeadStatus.SITE_VISIT_SCHEDULED,
    LeadStatus.SITE_VISIT_COMPLETED,
    LeadStatus.NEGOTIATION,
    LeadStatus.BOOKING_INITIATED,
  ]);

  /**
   * Strict Transition Matrix for Leads (spec §1 transition table).
   * Key: Current Status → allowed next statuses.
   */
  private static transitionMatrix: Record<string, string[]> = {
    [LeadStatus.NEW]: [LeadStatus.ASSIGNED],

    [LeadStatus.ASSIGNED]: [LeadStatus.CONTACTED, LeadStatus.DROPPED],

    [LeadStatus.CONTACTED]: [
      LeadStatus.QUALIFICATION_PENDING,
      LeadStatus.QUALIFIED,
      LeadStatus.DROPPED,
    ],

    [LeadStatus.QUALIFICATION_PENDING]: [
      LeadStatus.QUALIFIED,
      LeadStatus.DROPPED,
    ],

    [LeadStatus.QUALIFIED]: [
      LeadStatus.DEMO_SCHEDULED,
      LeadStatus.SITE_VISIT_SCHEDULED,
      LeadStatus.DROPPED,
    ],

    [LeadStatus.DEMO_SCHEDULED]: [
      LeadStatus.DEMO_COMPLETED,
      LeadStatus.DROPPED,
    ],

    [LeadStatus.DEMO_COMPLETED]: [
      LeadStatus.SITE_VISIT_SCHEDULED,
      LeadStatus.DROPPED,
    ],

    [LeadStatus.SITE_VISIT_SCHEDULED]: [
      LeadStatus.SITE_VISIT_COMPLETED,
      LeadStatus.DROPPED,
    ],

    [LeadStatus.SITE_VISIT_COMPLETED]: [
      LeadStatus.NEGOTIATION,
      LeadStatus.DROPPED,
    ],

    [LeadStatus.NEGOTIATION]: [
      LeadStatus.BOOKING_INITIATED,
      LeadStatus.DROPPED,
    ],

    [LeadStatus.BOOKING_INITIATED]: [
      LeadStatus.BOOKED,
      LeadStatus.DROPPED,
    ],

    [LeadStatus.BOOKED]: [], // Terminal won state

    [LeadStatus.DROPPED]: [LeadStatus.RECOVERED_TO_POOL],

    [LeadStatus.RECOVERED_TO_POOL]: [LeadStatus.ASSIGNED],
  };

  canTransition(req: WorkflowTransitionRequest): WorkflowTransitionResult {
    const { currentState, action: newStatus, entity } = req;

    if (currentState === newStatus) {
      return { allowed: true, nextState: newStatus };
    }

    const allowedTransitions = LeadWorkflow.transitionMatrix[currentState] || [];

    if (!allowedTransitions.includes(newStatus)) {
      return {
        allowed: false,
        reason: `Invalid lead status transition from ${currentState} to ${newStatus}`,
      };
    }

    // ── Field-level guards (spec §1) ──

    // DROPPED requires a non-empty reason and is only valid from the spec's
    // explicit droppable set (defensive; the matrix already limits this).
    if (newStatus === LeadStatus.DROPPED) {
      if (!LeadWorkflow.DROPPABLE_FROM.has(currentState)) {
        return {
          allowed: false,
          reason: `Cannot drop a lead from ${currentState}`,
        };
      }
      const reason =
        (entity && (entity.exit_reason ?? entity.exitReason)) || '';
      if (!reason || reason.trim() === '') {
        return {
          allowed: false,
          reason: 'Transition to DROPPED requires a non-empty exit_reason',
        };
      }
    }

    // DEMO_SCHEDULED requires a scheduled date and a handler.
    if (newStatus === LeadStatus.DEMO_SCHEDULED) {
      if (!entity || !entity.demo_scheduled_at || !entity.demo_handler_id) {
        return {
          allowed: false,
          reason:
            'Transition to DEMO_SCHEDULED requires demo_scheduled_at and demo_handler_id',
        };
      }
    }

    // SITE_VISIT_SCHEDULED requires at least one linked SiteVisitBooking.
    if (newStatus === LeadStatus.SITE_VISIT_SCHEDULED) {
      const visits = (entity && (entity.site_visits || [])) || [];
      if (visits.length === 0) {
        return {
          allowed: false,
          reason:
            'Transition to SITE_VISIT_SCHEDULED requires at least one SiteVisitBooking',
        };
      }
    }

    // SITE_VISIT_COMPLETED requires every linked visit to be COMPLETED.
    if (newStatus === LeadStatus.SITE_VISIT_COMPLETED) {
      const visits = (entity && (entity.site_visits || [])) || [];
      if (!visits.some((v: any) => v.status === 'COMPLETED')) {
        return {
          allowed: false,
          reason:
            'Transition to SITE_VISIT_COMPLETED requires at least one SiteVisitBooking with status COMPLETED',
        };
      }
    }

    // NEGOTIATION requires an auto-created Opportunity with expected_value.
    if (newStatus === LeadStatus.NEGOTIATION) {
      const opp = (entity && (entity.opportunities || entity.opportunity)) || null;
      const expected =
        opp && (opp.expected_value ?? opp.expectedValue);
      if (expected === undefined || expected === null) {
        return {
          allowed: false,
          reason: 'Transition to NEGOTIATION requires an Opportunity with expected_value',
        };
      }
    }

    // BOOKING_INITIATED requires the opportunity finalized (expected_value + target property).
    if (newStatus === LeadStatus.BOOKING_INITIATED) {
      const opp = (entity && (entity.opportunities || entity.opportunity)) || null;
      const expected =
        opp && (opp.expected_value ?? opp.expectedValue);
      const propertyId =
        opp && (opp.property_id ?? opp.propertyId);
      if (expected === undefined || expected === null || !propertyId) {
        return {
          allowed: false,
          reason:
            'Transition to BOOKING_INITIATED requires Opportunity.expected_value and a finalized target property',
        };
      }
    }

    return { allowed: true, nextState: newStatus };
  }

  // Keeping validateTransition for backward compatibility until all services are migrated
  static validateTransition(currentStatus: string, newStatus: string): void {
    if (currentStatus === newStatus) return;
    const allowedTransitions = this.transitionMatrix[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      const error = new Error(`Invalid lead status transition from ${currentStatus} to ${newStatus}`);
      (error as any).code = 'INVALID_STATE_TRANSITION';
      throw error;
    }
  }
}
