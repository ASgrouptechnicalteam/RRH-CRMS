import { LeadStatus } from '@rrh-ems/shared';
import { DomainWorkflow, WorkflowTransitionRequest, WorkflowTransitionResult } from './types';

/**
 * Phase 5 - Lead Workflow State Machine
 * Centralizes lifecycle transition logic to prevent invalid states.
 */
export class LeadWorkflow implements DomainWorkflow {
  /**
   * Strict Transition Matrix for Leads
   * Key: Current Status
   * Value: Array of allowed next statuses
   */
  private static transitionMatrix: Record<string, string[]> = {
    [LeadStatus.NEW]: [LeadStatus.ASSIGNED],
    [LeadStatus.ASSIGNED]: [LeadStatus.CONTACTED, LeadStatus.RECOVERED_TO_POOL],
    [LeadStatus.CONTACTED]: [LeadStatus.QUALIFIED, LeadStatus.LOST],
    [LeadStatus.QUALIFIED]: [LeadStatus.SITE_VISIT_SCHEDULED, LeadStatus.NEGOTIATION, LeadStatus.LOST],
    [LeadStatus.SITE_VISIT_SCHEDULED]: [LeadStatus.NEGOTIATION, LeadStatus.LOST],
    [LeadStatus.NEGOTIATION]: [LeadStatus.WON, LeadStatus.LOST],
    [LeadStatus.LOST]: [LeadStatus.RECOVERED_TO_POOL],
    [LeadStatus.RECOVERED_TO_POOL]: [LeadStatus.ASSIGNED],
    [LeadStatus.WON]: [], // Terminal state
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
