import { WorkflowEngine } from '../../apps/api/src/workflows/workflowEngine';
import { WorkflowDomain, WorkflowTransitionRequest } from '../../apps/api/src/workflows/types';
import { LeadStatus, PropertyStatus } from '@rrh-ems/shared';
import { TokenPayload } from '../../apps/api/src/utils/jwt';

describe('WorkflowEngine (Phase 5 Centralized Engine)', () => {
  // Dummy actor and entity for workflow context
  const dummyActor: TokenPayload = {
    employeeId: 1,
    employeeCode: 'TEST',
    companyId: 1,
    branchId: null,
    roles: [],
    permissions: []
  };

  const dummyEntity = { id: 1, company_id: 1 };

  const buildReq = (domain: WorkflowDomain, currentState: string, action: string): WorkflowTransitionRequest => ({
    domain,
    currentState,
    action,
    actor: dummyActor,
    entity: dummyEntity,
  });

  describe('Lead Workflow', () => {
    it('allows valid transition ASSIGNED → CONTACTED', () => {
      const res = WorkflowEngine.canTransition(
        buildReq(WorkflowDomain.LEAD, LeadStatus.ASSIGNED, LeadStatus.CONTACTED)
      );
      expect(res.allowed).toBe(true);
      expect(res.nextState).toBe(LeadStatus.CONTACTED);
    });

    it('prevents invalid state skipping NEW → CONTACTED', () => {
      const res = WorkflowEngine.canTransition(
        buildReq(WorkflowDomain.LEAD, LeadStatus.NEW, LeadStatus.CONTACTED)
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/Invalid lead status transition/);
    });

    it('prevents invalid transition LOST → WON', () => {
      const res = WorkflowEngine.canTransition(
        buildReq(WorkflowDomain.LEAD, LeadStatus.LOST, LeadStatus.WON)
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/Invalid lead status transition/);
    });
  });

  describe('Property Workflow', () => {
    it('allows valid VERIFY transition', () => {
      const res = WorkflowEngine.canTransition(
        buildReq(WorkflowDomain.PROPERTY, PropertyStatus.PENDING_VERIFICATION, 'VERIFY')
      );
      expect(res.allowed).toBe(true);
      expect(res.nextState).toBe(PropertyStatus.PENDING_DM_POLISH);
    });

    it('allows valid DM_POLISH transition', () => {
      const res = WorkflowEngine.canTransition(
        buildReq(WorkflowDomain.PROPERTY, PropertyStatus.PENDING_DM_POLISH, 'DM_POLISH')
      );
      expect(res.allowed).toBe(true);
      expect(res.nextState).toBe(PropertyStatus.PENDING_MD_APPROVAL);
    });

    it('allows valid MD_APPROVE transition', () => {
      const res = WorkflowEngine.canTransition(
        buildReq(WorkflowDomain.PROPERTY, PropertyStatus.PENDING_MD_APPROVAL, 'MD_APPROVE')
      );
      expect(res.allowed).toBe(true);
      expect(res.nextState).toBe(PropertyStatus.LIVE);
    });

    it('prevents invalid out-of-order transition (DM_POLISH from VERIFICATION)', () => {
      const res = WorkflowEngine.canTransition(
        buildReq(WorkflowDomain.PROPERTY, PropertyStatus.PENDING_VERIFICATION, 'DM_POLISH')
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/Invalid workflow transition/);
    });
  });

  describe('Site Visit Workflow', () => {
    it('allows valid VERIFY transition', () => {
      const res = WorkflowEngine.canTransition(
        buildReq(WorkflowDomain.SITE_VISIT, 'PENDING_VERIFICATION', 'VERIFY')
      );
      expect(res.allowed).toBe(true);
    });

    it('allows valid ASSIGN_AGENT transition', () => {
      const res = WorkflowEngine.canTransition(
        buildReq(WorkflowDomain.SITE_VISIT, 'CONFIRMED', 'ASSIGN_AGENT')
      );
      expect(res.allowed).toBe(true);
    });

    it('allows valid COMPLETE transition', () => {
      const res = WorkflowEngine.canTransition(
        buildReq(WorkflowDomain.SITE_VISIT, 'ASSIGNED_TO_AGENT', 'COMPLETE')
      );
      expect(res.allowed).toBe(true);
    });

    it('prevents invalid out-of-order transition (COMPLETE from PENDING)', () => {
      const res = WorkflowEngine.canTransition(
        buildReq(WorkflowDomain.SITE_VISIT, 'PENDING_VERIFICATION', 'COMPLETE')
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/Invalid workflow transition/);
    });
  });

  describe('WorkflowEngine Strict Separation', () => {
    it('does not perform authorization checking internally', () => {
      // Create an unauthorized actor (no roles, no permissions, different company)
      const unauthorizedActor: TokenPayload = {
        employeeId: 999,
        employeeCode: 'HACKER',
        companyId: 999, // mismatch
        branchId: null,
        roles: [],
        permissions: []
      };

      // The workflow engine should still allow a VALID state transition
      // because it only checks STATE, not WHO is asking.
      // (The actual authorization 403 block happens before this engine is called)
      const res = WorkflowEngine.canTransition({
        domain: WorkflowDomain.PROPERTY,
        currentState: PropertyStatus.PENDING_VERIFICATION,
        action: 'VERIFY',
        actor: unauthorizedActor,
        entity: { id: 1, company_id: 1 }
      });

      expect(res.allowed).toBe(true);
    });
  });
});
