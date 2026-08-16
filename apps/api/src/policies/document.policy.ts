import { TokenPayload } from '../utils/jwt';
import { Roles, Permissions } from '@rrh-ems/shared';

interface DocumentLike {
  company_id: number;
  document_type: string;
  status: string;
  verification_status: string;
  uploaded_by_id: number;
  deleted_at: Date | null;
  verified_by_id: number | null;
  verified_at: Date | null;
  version: number;
}

const KYC_TYPES = ['KYC_PAN', 'KYC_AADHAAR'];

export const KYC_DOCUMENT_TYPES = KYC_TYPES;

const MANAGEMENT_ROLES = [
  Roles.MD,
  Roles.ADMIN,
  Roles.HR_MANAGER,
  Roles.FINANCE,
  Roles.MARKETING_DIRECTOR,
  Roles.DIGITAL_LEAD_OPERATOR,
  Roles.PROJECT_MANAGER,
];

const KYC_AUTHORIZED_ROLES = [
  Roles.MD,
  Roles.ADMIN,
  Roles.HR_MANAGER,
  Roles.FINANCE,
];

export class DocumentPolicy {
  static isManagement(user: TokenPayload): boolean {
    return user.roles.some((r) => MANAGEMENT_ROLES.includes(r as any));
  }

  static isKYCRole(user: TokenPayload): boolean {
    return user.roles.some((r) => KYC_AUTHORIZED_ROLES.includes(r as any));
  }

  private static isKYCType(documentType: string): boolean {
    return KYC_TYPES.includes(documentType);
  }

  static canView(user: TokenPayload, doc: DocumentLike): boolean {
    if (doc.company_id !== user.companyId) return false;
    if (doc.deleted_at) return this.isManagement(user);
    if (this.isKYCType(doc.document_type)) return this.isKYCRole(user);
    if (this.isManagement(user)) return true;
    return doc.uploaded_by_id === user.employeeId;
  }

  static canCreate(user: TokenPayload): boolean {
    return (user.permissions || []).includes(Permissions.DOCUMENTS_CREATE);
  }

  static canVerify(user: TokenPayload, doc: DocumentLike): boolean {
    if (!(user.permissions || []).includes(Permissions.DOCUMENTS_VERIFY)) return false;
    if (doc.company_id !== user.companyId) return false;
    if (doc.deleted_at) return false;
    return true;
  }

  static canDelete(user: TokenPayload, doc: DocumentLike): boolean {
    if (!(user.permissions || []).includes(Permissions.DOCUMENTS_DELETE)) return false;
    if (doc.company_id !== user.companyId) return false;
    if (doc.deleted_at) return false;
    return true;
  }

  static canRestore(user: TokenPayload, doc: DocumentLike): boolean {
    if (!(user.permissions || []).includes(Permissions.DOCUMENTS_DELETE)) return false;
    if (doc.company_id !== user.companyId) return false;
    if (!doc.deleted_at) return false;
    return true;
  }

  static canDownload(user: TokenPayload, doc: DocumentLike): boolean {
    return this.canView(user, doc);
  }
}
