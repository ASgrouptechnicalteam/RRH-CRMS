import { WorkflowDomain, WorkflowTransitionRequest, WorkflowTransitionResult, DomainWorkflow } from './types';
import { LeadWorkflow } from './lead.workflow';
import { PropertyWorkflow } from './property.workflow';
import { SiteVisitWorkflow } from './siteVisit.workflow';

export class WorkflowEngine {
  private static registry: Record<WorkflowDomain, DomainWorkflow> = {
    [WorkflowDomain.LEAD]: new LeadWorkflow(),
    [WorkflowDomain.PROPERTY]: new PropertyWorkflow(),
    [WorkflowDomain.SITE_VISIT]: new SiteVisitWorkflow(),
  };

  /**
   * Central entrypoint for all workflow transitions.
   * Delegates to the appropriate domain workflow for validation.
   * Does NOT perform authorization (that remains in the service layer via can()).
   */
  static canTransition(req: WorkflowTransitionRequest): WorkflowTransitionResult {
    const workflow = this.registry[req.domain];
    
    if (!workflow) {
      return {
        allowed: false,
        reason: `No workflow registered for domain ${req.domain}`
      };
    }

    return workflow.canTransition(req);
  }
}
