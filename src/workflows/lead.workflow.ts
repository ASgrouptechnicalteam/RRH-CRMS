import { LeadStatus } from '@rrh-ems/shared';
import { DomainWorkflow, WorkflowTransitionRequest, WorkflowTransitionResult } from './types';

/**
 * Lead Macro-Status Workflow State Machine (docs/LEAD-WORKFLOW-SPEC.md §1)
 *
 * Centralizes lifecycle transition logic so that the only valid state changes
 * mirror the spec's transition table. Per §0 design principles, the workflow
 * engine is the single authority allowed to write `Lead.status`; services must
 * route every status change through this matrix and must never issue a raw
 * `tx.lead.update({ status })`.
 *
 * Field-level guards called out in the spec table (e.g. `demo_scheduled_at`
 * set, qualification fields captured) are enforced at the service layer, NOT
 * here — this matrix governs *which* states are reachable from *which*, and is
 * kept in exact lockstep with the spec table.
 */
export class LeadWorkflow implements DomainWorkflow {
  /**
   * Strict Transition Matrix for Leads (spec §1 transition table)
   * Key: Current Status
   * Value: Array of allowed next statuses
   *
   * DROPPED is reachable from every active pipeline state
   * (ASSIGNED → BOOKING_INITIATED) per the "any of the above → DROPPED" row,
   * and it is terminal except for the RECOVERED_TO_POOL re-entry branch.
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
    const { currentState, action: newStatus } = req;

    if (currentState === newStatus) {
      return { allowed: true, nextState: newStatus };
    }

    const allowedTransitions = LeadWorkflow.transitionMatrix[currentState] || [];

    if (!allowedTransitions.includes(newStatus)) {
      return {
        allowed: false,
        reason: `Invalid lead status transition from ${currentState} to ${newStatus}`
      };
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
