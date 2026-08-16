import { TokenPayload } from '../utils/jwt';
import { Permission, Permissions, Roles } from '@rrh-ems/shared';
import { PropertyPolicy } from '../policies/property.policy';
import { LeadPolicy } from '../policies/lead.policy';
import { SiteVisitPolicy } from '../policies/siteVisit.policy';
import { ExpenseRefundPolicy } from '../policies/expenseRefund.policy';
import { TaskPolicy } from '../policies/task.policy';
import { ProjectPolicy } from '../policies/project.policy';
import { DocumentPolicy } from '../policies/document.policy';
import { KycPolicy } from '../policies/kyc.policy';

/**
 * Centralized Authorization Engine (Phase 1)
 *
 * @param user The authenticated user token payload
 * @param action The required action/permission
 * @param resource The specific resource being accessed (optional)
 * @returns boolean indicating if access is granted
 */
export const can = (user: TokenPayload, action: Permission, resource?: any): boolean => {
  // 1. Basic Permission Check
  // All internal employees (except those with specific overrides) rely on RBAC permissions.

  const hasBasePermission = (user.permissions || []).includes(action);

  // If they don't even have the base permission to attempt this action, reject early.
  // (Assuming every action corresponds directly to a defined Permission).
  if (!hasBasePermission) {
    return false;
  }

  // 3. Object-Level Resource Scope Check
  if (resource) {
    switch (action) {
      // -- PROJECTS --
      case Permissions.PROJECTS_READ:
        return ProjectPolicy.canRead(user, resource);

      case Permissions.PROJECTS_UPDATE:
        return ProjectPolicy.canUpdate(user, resource);

      case Permissions.PROJECTS_DELETE:
        return ProjectPolicy.canDelete(user, resource);

      // -- PROPERTIES --
      case Permissions.PROPERTIES_UPDATE:
      case Permissions.PROPERTIES_DELETE:
        // Updating requires you can at least verify or own it, or you are management.
        // Fallback to PropertyPolicy.canVerify for now as it handles assignment.
        return PropertyPolicy.canVerify(user, resource);
        
      case Permissions.PROPERTIES_VERIFY:
        return PropertyPolicy.canVerify(user, resource);
        
      case Permissions.PROPERTIES_DM_POLISH:
        return PropertyPolicy.canDMPolish(user, resource);
        
      case Permissions.PROPERTIES_MD_APPROVE:
        return PropertyPolicy.canMDApprove(user, resource);

      // -- LEADS --
      case Permissions.LEADS_READ:
      case Permissions.LEADS_UPDATE:
        return LeadPolicy.canMutate(user, resource);
        
      case Permissions.LEADS_ASSIGN:
        return LeadPolicy.canReassign(user, resource);

      // -- SITE VISITS --
      case Permissions.SITE_VISITS_VERIFY:
        return SiteVisitPolicy.canVerify(user, resource);
      case Permissions.SITE_VISITS_COMPLETE:
        return SiteVisitPolicy.canComplete(user, resource);
      
      case Permissions.SITE_VISITS_ASSIGN_AGENT:
        return SiteVisitPolicy.canAssignAgent(user, resource);

      // -- EMPLOYEES --
      case Permissions.EMPLOYEES_VIEW_SENSITIVE:
        // Must be same company (or Admin)
        if (user.roles.includes(Roles.ADMIN)) return true;
        if (resource.company_id && resource.company_id !== user.companyId) return false;
        return true;

      // -- EXPENSE REFUNDS --
      case Permissions.EXPENSES_REVIEW:
        if (!resource) return false;
        return ExpenseRefundPolicy.canAccountantReview(user, resource);

      case Permissions.EXPENSES_MD_APPROVE:
        if (!resource) return false;
        return ExpenseRefundPolicy.canMdReview(user, resource);
        
      case Permissions.EXPENSES_MARK_REFUNDED:
        if (!resource) return false;
        return ExpenseRefundPolicy.canMarkRefunded(user, resource);

      // -- TASKS --
      case Permissions.TASKS_UPDATE:
        if (!resource) return false;
        return TaskPolicy.canMutateSync(user, resource);

      // -- DOCUMENTS --
      case Permissions.DOCUMENTS_READ:
        if (!resource) return true;
        return DocumentPolicy.canView(user, resource);

      case Permissions.DOCUMENTS_VERIFY:
        if (!resource) return true;
        return DocumentPolicy.canVerify(user, resource);

      case Permissions.DOCUMENTS_DELETE:
        if (!resource) return true;
        return DocumentPolicy.canDelete(user, resource);

      // -- CUSTOMER KYC (Phase 11 Packet 3C) --
      case Permissions.CUSTOMERS_KYC_WRITE:
        if (!resource) return false;
        return KycPolicy.canWrite(user, resource);

      // Add other cases as needed
      default:
        // If it's a known resource but we don't have a specific policy wrapper yet,
        // we fallback to ensuring company boundaries (if the resource has a company_id).
        if (resource.company_id && resource.company_id !== user.companyId) {
          // Cross-company access is strictly forbidden unless ADMIN
          if (!user.roles.includes(Roles.ADMIN)) {
            return false;
          }
        }
        return true;
    }
  }

  // If no specific resource is provided, returning true implies they have the base permission.
  // Note: For resource-mutating operations, a resource SHOULD be provided.
  return true;
};
