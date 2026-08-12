import { DomainWorkflow, WorkflowTransitionRequest, WorkflowTransitionResult } from './types';

export type SiteVisitAction = 'VERIFY' | 'ASSIGN_AGENT' | 'COMPLETE';

export class SiteVisitWorkflow implements DomainWorkflow {
  private static validTransitions: Record<string, SiteVisitAction[]> = {
    'PENDING_VERIFICATION': ['VERIFY'],
    'CONFIRMED': ['ASSIGN_AGENT'],
    'ASSIGNED_TO_AGENT': ['COMPLETE'],
    // CANCELLED, COMPLETED are terminal states (at least currently)
  };

  canTransition(req: WorkflowTransitionRequest): WorkflowTransitionResult {
    const { currentState, action } = req;
    const allowedActions = SiteVisitWorkflow.validTransitions[currentState] || [];

    if (!allowedActions.includes(action as SiteVisitAction)) {
      return {
        allowed: false,
        reason: `Invalid workflow transition: Cannot perform ${action} from state ${currentState}`
      };
    }

    // Next states depend on the exact action and sub-decision (e.g. verified vs cancelled)
    return { allowed: true };
  }

  /**
   * Validates if a transition is allowed.
   * Throws an error (handled as 409 in service) if the transition is invalid.
   */
  static validateTransition(currentStatus: string, action: SiteVisitAction): void {
    const allowedActions = this.validTransitions[currentStatus] || [];
    
    if (!allowedActions.includes(action)) {
      throw { status: 409, message: `Invalid workflow transition: Cannot perform ${action} from state ${currentStatus}` };
    }
  }
}
