import { PropertyStatus } from '@rrh-ems/shared';
import { DomainWorkflow, WorkflowTransitionRequest, WorkflowTransitionResult } from './types';

export type PropertyAction = 'VERIFY' | 'DM_POLISH' | 'MD_APPROVE';

export class PropertyWorkflow implements DomainWorkflow {
  private static validTransitions: Record<string, PropertyAction[]> = {
    [PropertyStatus.PENDING_VERIFICATION]: ['VERIFY'],
    [PropertyStatus.PENDING_DM_POLISH]: ['DM_POLISH'],
    [PropertyStatus.PENDING_MD_APPROVAL]: ['MD_APPROVE'],
  };

  canTransition(req: WorkflowTransitionRequest): WorkflowTransitionResult {
    const { currentState, action } = req;
    const allowedActions = PropertyWorkflow.validTransitions[currentState] || [];

    if (!allowedActions.includes(action as PropertyAction)) {
      return {
        allowed: false,
        reason: `Invalid workflow transition: Cannot perform ${action} from state ${currentState}`
      };
    }

    // Determine next state
    let nextState;
    if (action === 'VERIFY') nextState = PropertyStatus.PENDING_DM_POLISH;
    else if (action === 'DM_POLISH') nextState = PropertyStatus.PENDING_MD_APPROVAL;
    else if (action === 'MD_APPROVE') nextState = PropertyStatus.LIVE; // Or REJECTED, but that's handled dynamically by the service based on 'approved' flag. We just validate the action.

    return { allowed: true, nextState };
  }

  /**
   * Validates if a transition is allowed.
   * Throws an error (handled as 409 in service) if the transition is invalid.
   */
  static validateTransition(currentStatus: string, action: PropertyAction): void {
    const allowedActions = this.validTransitions[currentStatus] || [];
    
    if (!allowedActions.includes(action)) {
      throw new Error(`Invalid workflow transition: Cannot perform ${action} from state ${currentStatus}`);
    }
  }
}
