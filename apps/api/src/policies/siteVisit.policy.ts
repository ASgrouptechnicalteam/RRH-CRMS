import { TokenPayload } from '../utils/jwt';
import { Roles, Permissions } from '@rrh-ems/shared';
import { SiteVisitBooking, Lead, Employee } from '@prisma/client';

export class SiteVisitPolicy {
  private static isManagement(user: TokenPayload): boolean {
    return user.roles.some((r) =>
      [
        Roles.MD,
        Roles.ADMIN,
        Roles.HR_MANAGER,
        Roles.MARKETING_DIRECTOR,
        Roles.PROJECT_MANAGER,
      ].includes(r as any)
    );
  }

  static canList(user: TokenPayload): any {
    const isManagement = this.isManagement(user);
    
    // Unconditional tenant isolation via explicit AND
    const whereCondition: any = {
      AND: [
        { lead: { company_id: user.companyId } }
      ]
    };

    if (!isManagement) {
      // Non-management restricted to their assigned visits, strictly within their company
      whereCondition.AND.push({
        OR: [
          { telecaller_id: user.employeeId },
          { assigned_agent_id: user.employeeId },
          { project_manager_id: user.employeeId },
        ]
      });
    }
    
    return whereCondition;
  }

  static canCreate(user: TokenPayload, lead: { company_id: number }): boolean {
    if (!(user.permissions || []).includes(Permissions.SITE_VISITS_CREATE)) {
      return false;
    }
    return lead.company_id === user.companyId;
  }

  static canVerify(user: TokenPayload, visit: { lead: { company_id: number } }): boolean {
    if (!(user.permissions || []).includes(Permissions.SITE_VISITS_VERIFY)) {
      return false;
    }
    return visit.lead.company_id === user.companyId;
  }

  static canAssignAgent(user: TokenPayload, visit: { lead: { company_id: number } }, agent?: Employee): boolean {
    if (!(user.permissions || []).includes(Permissions.SITE_VISITS_ASSIGN_AGENT)) {
      return false;
    }
    if (visit.lead.company_id !== user.companyId) {
      return false;
    }
    if (agent && agent.company_id !== user.companyId) {
      return false; // Cross-company agent assignment not allowed
    }
    return true;
  }

  static canComplete(user: TokenPayload, visit: any): boolean {
    if (!(user.permissions || []).includes(Permissions.SITE_VISITS_COMPLETE)) {
      return false;
    }
    if (visit.lead.company_id !== user.companyId) {
      return false;
    }
    // Fix IDOR: ensure the completing agent is the assigned agent, unless they are admin/management
    if (user.roles.includes(Roles.MD) || user.roles.includes(Roles.ADMIN)) {
      return true;
    }
    return visit.assigned_agent_id === user.employeeId;
  }
}
