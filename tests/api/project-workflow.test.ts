import { prisma } from '../../apps/api/src/lib/prisma';
import { ProjectService } from '../../apps/api/src/services/project.service';
import { ProjectWorkflow } from '../../apps/api/src/workflows/project.workflow';
import { WorkflowEngine } from '../../apps/api/src/workflows/workflowEngine';
import { WorkflowDomain } from '../../apps/api/src/workflows/types';
import { Roles } from '@rrh-ems/shared';
import { TokenPayload } from '../../apps/api/src/utils/jwt';

// Phase 2.5 (2026-09-06): Project.status was previously writable to any of its
// 4 enum values from any other value with zero validation (a PLANNING project
// could jump straight to COMPLETED, or a COMPLETED project could be silently
// un-done back to PLANNING). This test guards the new ProjectWorkflow engine
// that closes that gap, mirroring PropertyWorkflow's structure.
describe('Phase 2.5 - Project workflow engine', () => {
  describe('ProjectWorkflow.canTransition (unit-level, no DB)', () => {
    const wf = new ProjectWorkflow();

    it('1. PLANNING -> UNDER_CONSTRUCTION is allowed', () => {
      const res = wf.canTransition({
        domain: WorkflowDomain.PROJECT,
        currentState: 'PLANNING',
        action: 'UNDER_CONSTRUCTION',
        actor: {} as TokenPayload,
        entity: {},
      });
      expect(res.allowed).toBe(true);
      expect(res.nextState).toBe('UNDER_CONSTRUCTION');
    });

    it('2. UNDER_CONSTRUCTION -> COMPLETED is allowed', () => {
      const res = wf.canTransition({
        domain: WorkflowDomain.PROJECT,
        currentState: 'UNDER_CONSTRUCTION',
        action: 'COMPLETED',
        actor: {} as TokenPayload,
        entity: {},
      });
      expect(res.allowed).toBe(true);
      expect(res.nextState).toBe('COMPLETED');
    });

    it('3. PLANNING -> CANCELLED and UNDER_CONSTRUCTION -> CANCELLED are both allowed', () => {
      expect(
        wf.canTransition({
          domain: WorkflowDomain.PROJECT,
          currentState: 'PLANNING',
          action: 'CANCELLED',
          actor: {} as TokenPayload,
          entity: {},
        }).allowed,
      ).toBe(true);
      expect(
        wf.canTransition({
          domain: WorkflowDomain.PROJECT,
          currentState: 'UNDER_CONSTRUCTION',
          action: 'CANCELLED',
          actor: {} as TokenPayload,
          entity: {},
        }).allowed,
      ).toBe(true);
    });

    it('4. PLANNING -> COMPLETED (skipping a stage) is rejected', () => {
      const res = wf.canTransition({
        domain: WorkflowDomain.PROJECT,
        currentState: 'PLANNING',
        action: 'COMPLETED',
        actor: {} as TokenPayload,
        entity: {},
      });
      expect(res.allowed).toBe(false);
    });

    it('5. COMPLETED is terminal - cannot be cancelled or moved anywhere', () => {
      expect(
        wf.canTransition({
          domain: WorkflowDomain.PROJECT,
          currentState: 'COMPLETED',
          action: 'CANCELLED',
          actor: {} as TokenPayload,
          entity: {},
        }).allowed,
      ).toBe(false);
      expect(
        wf.canTransition({
          domain: WorkflowDomain.PROJECT,
          currentState: 'COMPLETED',
          action: 'UNDER_CONSTRUCTION',
          actor: {} as TokenPayload,
          entity: {},
        }).allowed,
      ).toBe(false);
    });

    it('6. CANCELLED is terminal - cannot be revived', () => {
      expect(
        wf.canTransition({
          domain: WorkflowDomain.PROJECT,
          currentState: 'CANCELLED',
          action: 'PLANNING' as any,
          actor: {} as TokenPayload,
          entity: {},
        }).allowed,
      ).toBe(false);
      expect(
        wf.canTransition({
          domain: WorkflowDomain.PROJECT,
          currentState: 'CANCELLED',
          action: 'UNDER_CONSTRUCTION',
          actor: {} as TokenPayload,
          entity: {},
        }).allowed,
      ).toBe(false);
    });

    it('7. Registered in WorkflowEngine under the PROJECT domain', () => {
      const res = WorkflowEngine.canTransition({
        domain: WorkflowDomain.PROJECT,
        currentState: 'PLANNING',
        action: 'UNDER_CONSTRUCTION',
        actor: {} as TokenPayload,
        entity: {},
      });
      expect(res.allowed).toBe(true);
    });

    // Item #15 from the user's manual QA pass: a Hold/Activate toggle for a
    // whole project, distinct from CANCELLED (a pause, not a kill).
    it('7a. PLANNING -> ON_HOLD and UNDER_CONSTRUCTION -> ON_HOLD are both allowed', () => {
      expect(
        wf.canTransition({
          domain: WorkflowDomain.PROJECT,
          currentState: 'PLANNING',
          action: 'ON_HOLD',
          actor: {} as TokenPayload,
          entity: {},
        }).allowed,
      ).toBe(true);
      expect(
        wf.canTransition({
          domain: WorkflowDomain.PROJECT,
          currentState: 'UNDER_CONSTRUCTION',
          action: 'ON_HOLD',
          actor: {} as TokenPayload,
          entity: {},
        }).allowed,
      ).toBe(true);
    });

    it('7b. ON_HOLD -> UNDER_CONSTRUCTION (Activate) and ON_HOLD -> CANCELLED are both allowed', () => {
      expect(
        wf.canTransition({
          domain: WorkflowDomain.PROJECT,
          currentState: 'ON_HOLD',
          action: 'UNDER_CONSTRUCTION',
          actor: {} as TokenPayload,
          entity: {},
        }).allowed,
      ).toBe(true);
      expect(
        wf.canTransition({
          domain: WorkflowDomain.PROJECT,
          currentState: 'ON_HOLD',
          action: 'CANCELLED',
          actor: {} as TokenPayload,
          entity: {},
        }).allowed,
      ).toBe(true);
    });

    it('7c. ON_HOLD cannot jump straight to COMPLETED (must resume first)', () => {
      expect(
        wf.canTransition({
          domain: WorkflowDomain.PROJECT,
          currentState: 'ON_HOLD',
          action: 'COMPLETED',
          actor: {} as TokenPayload,
          entity: {},
        }).allowed,
      ).toBe(false);
    });

    it('7d. COMPLETED cannot be put on hold — it is terminal', () => {
      expect(
        wf.canTransition({
          domain: WorkflowDomain.PROJECT,
          currentState: 'COMPLETED',
          action: 'ON_HOLD',
          actor: {} as TokenPayload,
          entity: {},
        }).allowed,
      ).toBe(false);
    });
  });

  describe('ProjectService.updateProject / deleteProject (DB-backed)', () => {
    const companyId = 1;
    const mockAdmin: TokenPayload = {
      employeeId: 999905,
      employeeCode: 'ADMIN-2-5',
      companyId,
      branchId: null,
      roles: [Roles.ADMIN],
    };
    let projectId: number;

    beforeAll(async () => {
      await prisma.employee.create({
        data: {
          id: mockAdmin.employeeId,
          employee_code: 'ADMIN-2-5',
          company_id: companyId,
          password_hash: '',
          status: 'ACTIVE',
          full_name: 'Phase 2.5 Test Admin',
        },
      });
    });

    afterAll(async () => {
      await prisma.employee.delete({ where: { id: mockAdmin.employeeId } });
    });

    beforeEach(async () => {
      const project = await prisma.project.create({
        data: {
          project_code: `TEST-2-5-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          company_id: companyId,
          name: 'Phase 2.5 Workflow Test Project',
          location: 'Test Location',
          slug: `test-2-5-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          status: 'PLANNING',
        },
      });
      projectId = project.id;
    });

    afterEach(async () => {
      // Properties created directly under projectId (2.10's tests) must go
      // before the project itself — Property.project_id has no onDelete
      // cascade, so a leftover unit would FK-block this cleanup.
      await prisma.property.deleteMany({ where: { project_id: projectId } });
      await prisma.auditEvent.deleteMany({
        where: { entity_type: 'PROJECT', entity_id: projectId },
      });
      await prisma.project.deleteMany({ where: { id: projectId } });
    });

    it('8. updateProject allows a legal transition and writes an audit event', async () => {
      const updated = await ProjectService.updateProject(mockAdmin, projectId, {
        status: 'UNDER_CONSTRUCTION',
      } as any);
      expect(updated.status).toBe('UNDER_CONSTRUCTION');

      const audit = await prisma.auditEvent.findFirst({
        where: { entity_type: 'PROJECT', entity_id: projectId, action: 'STATUS_CHANGE' },
      });
      expect(audit).not.toBeNull();
      expect(audit?.old_value).toBe('PLANNING');
      expect(audit?.new_value).toBe('UNDER_CONSTRUCTION');
    });

    it('9. updateProject rejects an illegal transition (PLANNING -> COMPLETED)', async () => {
      await expect(
        ProjectService.updateProject(mockAdmin, projectId, { status: 'COMPLETED' } as any),
      ).rejects.toMatchObject({ status: 409 });
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      expect(project?.status).toBe('PLANNING'); // untouched
    });

    it('10. updateProject rejects reviving a CANCELLED project', async () => {
      await prisma.project.update({ where: { id: projectId }, data: { status: 'CANCELLED' } });
      await expect(
        ProjectService.updateProject(mockAdmin, projectId, { status: 'PLANNING' } as any),
      ).rejects.toMatchObject({ status: 409 });
    });

    it('11. updateProject treats resubmitting the same status as a no-op (not a transition error)', async () => {
      const updated = await ProjectService.updateProject(mockAdmin, projectId, {
        status: 'PLANNING',
        name: 'Renamed',
      } as any);
      expect(updated.status).toBe('PLANNING');
      expect(updated.name).toBe('Renamed');
    });

    it('12. deleteProject cancels a PLANNING project and writes an audit event', async () => {
      const deleted = await ProjectService.deleteProject(mockAdmin, projectId);
      expect(deleted.status).toBe('CANCELLED');
      const audit = await prisma.auditEvent.findFirst({
        where: { entity_type: 'PROJECT', entity_id: projectId, action: 'STATUS_CHANGE' },
      });
      expect(audit).not.toBeNull();
    });

    it('13. deleteProject rejects cancelling a COMPLETED project', async () => {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'UNDER_CONSTRUCTION' },
      });
      await ProjectService.updateProject(mockAdmin, projectId, { status: 'COMPLETED' } as any);
      await expect(ProjectService.deleteProject(mockAdmin, projectId)).rejects.toMatchObject({
        status: 409,
      });
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      expect(project?.status).toBe('COMPLETED'); // untouched
    });

    it('14. deleteProject on an already-CANCELLED project is an idempotent no-op, not an error', async () => {
      await prisma.project.update({ where: { id: projectId }, data: { status: 'CANCELLED' } });
      const result = await ProjectService.deleteProject(mockAdmin, projectId);
      expect(result.status).toBe('CANCELLED');
    });

    // Phase 2.10: deleteProject previously had zero awareness of live inventory
    // underneath — cancelling a project with active bookings would silently
    // orphan them. Hard-blocked rather than a "cancel anyway" confirmation.
    it('15. deleteProject blocks cancellation while a LIVE unit exists underneath', async () => {
      const unit = await prisma.property.create({
        data: {
          property_code: `TEST-2-10-${Date.now()}`,
          company_id: companyId,
          project_id: projectId,
          title: 'Active Unit',
          brand_type: 'SONTHILLU',
          category: 'PLOT',
          final_price: 100,
          area_sqft: 100,
          location: 'Loc',
          status: 'LIVE',
          created_by_id: mockAdmin.employeeId,
        },
      });
      await expect(ProjectService.deleteProject(mockAdmin, projectId)).rejects.toMatchObject({
        status: 409,
      });
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      expect(project?.status).toBe('PLANNING'); // untouched
      await prisma.property.delete({ where: { id: unit.id } });
    });

    it('16a. updateProject can put a project ON_HOLD and Activate resumes it into UNDER_CONSTRUCTION', async () => {
      await ProjectService.updateProject(mockAdmin, projectId, {
        status: 'UNDER_CONSTRUCTION',
      } as any);
      const held = await ProjectService.updateProject(mockAdmin, projectId, {
        status: 'ON_HOLD',
      } as any);
      expect(held.status).toBe('ON_HOLD');

      const resumed = await ProjectService.updateProject(mockAdmin, projectId, {
        status: 'UNDER_CONSTRUCTION',
      } as any);
      expect(resumed.status).toBe('UNDER_CONSTRUCTION');
    });

    it('16. deleteProject succeeds once no LIVE/LOCKED/BOOKED units remain (e.g. all REJECTED)', async () => {
      const unit = await prisma.property.create({
        data: {
          property_code: `TEST-2-10B-${Date.now()}`,
          company_id: companyId,
          project_id: projectId,
          title: 'Inactive Unit',
          brand_type: 'SONTHILLU',
          category: 'PLOT',
          final_price: 100,
          area_sqft: 100,
          location: 'Loc',
          status: 'REJECTED',
          created_by_id: mockAdmin.employeeId,
        },
      });
      const result = await ProjectService.deleteProject(mockAdmin, projectId);
      expect(result.status).toBe('CANCELLED');
      await prisma.property.delete({ where: { id: unit.id } });
    });
  });
});
