import { PrismaClient } from '@prisma/client';
import { TokenPayload } from '../utils/jwt';
import { Permissions, DOCUMENT_TYPE_ENTITY_REQUIREMENTS } from '@rrh-ems/shared';
import { DocumentPolicy, KYC_DOCUMENT_TYPES } from '../policies/document.policy';
import { KycService } from './kyc.service';
import { LocalStorageService, StorageService } from './storage.service';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();
const p = prisma as any;

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIMES: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
};
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const storageService: StorageService = new LocalStorageService(path.join(process.cwd(), 'uploads'));

function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  const hex = buffer.subarray(0, 12).toString('hex');
  if (hex.startsWith('25504446')) return 'application/pdf';
  if (hex.startsWith('ffd8ff')) return 'image/jpeg';
  if (hex.startsWith('89504e47')) return 'image/png';
  if (hex.startsWith('52494646') && hex.substring(16, 24) === '57454250') return 'image/webp';
  return null;
}

function validateFileType(originalName: string, buffer: Buffer): { valid: boolean; error?: string } {
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'File type not allowed. Allowed: ' + ALLOWED_EXTENSIONS.join(', ') };
  }
  const detectedMime = detectMimeFromBuffer(buffer);
  if (!detectedMime) {
    return { valid: false, error: 'Could not detect file type. File may be corrupt.' };
  }
  const expectedMimes = ALLOWED_MIMES[ext];
  if (!expectedMimes || !expectedMimes.includes(detectedMime)) {
    return { valid: false, error: 'File extension ' + ext + ' does not match detected type ' + detectedMime };
  }
  return { valid: true };
}

function validateEntityOwnership(
  documentType: string,
  entityIds: Record<string, number | undefined>,
  _userCompanyId: number
): { valid: boolean; error?: string } {
  const reqs = DOCUMENT_TYPE_ENTITY_REQUIREMENTS[documentType];
  if (!reqs) {
    return { valid: false, error: 'Unknown document type: ' + documentType };
  }

  for (const field of reqs.required) {
    if (!entityIds[field]) {
      return { valid: false, error: 'Document type ' + documentType + ' requires ' + field };
    }
  }

  const hasAnyEntity = Object.values(entityIds).some((v) => v !== undefined);
  if (!hasAnyEntity && documentType !== 'OTHER') {
    return { valid: false, error: 'At least one entity reference is required' };
  }

  return { valid: true };
}

async function validateEntitiesExist(
  entityIds: Record<string, number | undefined>,
  userCompanyId: number,
  tx: any
): Promise<{ valid: boolean; error?: string }> {
  const entityMap: Record<string, string> = {
    customer_id: 'customer',
    lead_id: 'lead',
    opportunity_id: 'opportunity',
    booking_id: 'booking',
    property_id: 'property',
    project_id: 'project',
    payment_id: 'payment',
  };

  for (const [field, entityName] of Object.entries(entityMap)) {
    const entityId = entityIds[field];
    if (!entityId) continue;

    const entity = await tx[entityName].findFirst({ where: { id: entityId, company_id: userCompanyId } });
    if (!entity) {
      return { valid: false, error: entityName + ' with id ' + entityId + ' not found' };
    }
  }

  return { valid: true };
}

function generateDocumentCode(companyId: number): string {
  const year = new Date().getFullYear();
  const random = crypto.randomInt(1000, 9999);
  return 'RRH-DOC-' + year + '-' + companyId + random;
}

export class DocumentService {
  static async uploadDocument(
    user: TokenPayload,
    file: Express.Multer.File,
    data: {
      document_type: string;
      title: string;
      customer_id?: number | null;
      lead_id?: number | null;
      opportunity_id?: number | null;
      booking_id?: number | null;
      property_id?: number | null;
      project_id?: number | null;
      payment_id?: number | null;
      notes?: string | null;
    }
  ) {
    if (!DocumentPolicy.canCreate(user)) {
      throw { status: 403, message: 'Forbidden: Missing documents.create permission' };
    }

    if (!file || file.size === 0) {
      throw { status: 400, message: 'No file provided or file is empty' };
    }

    if (file.size > MAX_FILE_SIZE) {
      throw { status: 400, message: 'File size exceeds maximum of 10MB' };
    }

    const typeValidation = validateFileType(file.originalname, file.buffer);
    if (!typeValidation.valid) {
      throw { status: 400, message: typeValidation.error };
    }

    const entityIds: Record<string, number | undefined> = {
      customer_id: data.customer_id ?? undefined,
      lead_id: data.lead_id ?? undefined,
      opportunity_id: data.opportunity_id ?? undefined,
      booking_id: data.booking_id ?? undefined,
      property_id: data.property_id ?? undefined,
      project_id: data.project_id ?? undefined,
      payment_id: data.payment_id ?? undefined,
    };

    const entityValidation = validateEntityOwnership(data.document_type, entityIds, user.companyId);
    if (!entityValidation.valid) {
      throw { status: 400, message: entityValidation.error };
    }

    const storagePath = await storageService.upload(file.buffer, file.originalname, file.mimetype);

    try {
      const doc = await p.$transaction(async (tx: any) => {
        const entityCheck = await validateEntitiesExist(entityIds, user.companyId, tx);
        if (!entityCheck.valid) {
          throw { status: 400, message: entityCheck.error };
        }

        const MAX_CODE_RETRIES = 2;
        for (let attempt = 0; attempt <= MAX_CODE_RETRIES; attempt++) {
          try {
            const documentCode = generateDocumentCode(user.companyId);

            const document = await tx.document.create({
              data: {
                document_code: documentCode,
                company_id: user.companyId,
                branch_id: user.branchId,
                document_type: data.document_type,
                title: data.title,
                original_name: file.originalname,
                storage_path: storagePath,
                mime_type: detectMimeFromBuffer(file.buffer) || file.mimetype,
                file_size: file.size,
                status: 'ACTIVE',
                verification_status: 'PENDING',
                uploaded_by_id: user.employeeId,
                customer_id: data.customer_id || null,
                lead_id: data.lead_id || null,
                opportunity_id: data.opportunity_id || null,
                booking_id: data.booking_id || null,
                property_id: data.property_id || null,
                project_id: data.project_id || null,
                payment_id: data.payment_id || null,
              },
            });

            await tx.auditEvent.create({
              data: {
                actor_id: user.employeeId,
                action: 'DOCUMENT_UPLOADED',
                entity_type: 'DOCUMENT',
                entity_id: document.id,
                old_value: null,
                new_value: JSON.stringify({
                  document_code: documentCode,
                  document_type: data.document_type,
                  title: data.title,
                }),
              },
            });

            return document;
          } catch (err: any) {
            if (err?.code === 'P2002' && err?.meta?.target?.includes('document_code') && attempt < MAX_CODE_RETRIES) {
              continue;
            }
            throw err;
          }
        }

        throw { status: 409, message: 'Document code generation failed due to uniqueness collision. Please retry.' };
      });

      return doc;
    } catch (err: any) {
      await storageService.delete(storagePath).catch(() => {});
      throw err;
    }
  }

  static async listDocuments(
    user: TokenPayload,
    filters: {
      customer_id?: number;
      lead_id?: number;
      opportunity_id?: number;
      booking_id?: number;
      property_id?: number;
      project_id?: number;
      payment_id?: number;
      document_type?: string;
      status?: string;
      verification_status?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      company_id: user.companyId,
      deleted_at: null,
    };

    // Authorization filter: mirror DocumentPolicy.canView() logic at DB level.
    // KYC roles (MD, Admin, HR, Finance) see all active documents in their company.
    // Other management roles see non-KYC documents only.
    // Non-management users see only their own non-KYC documents.
    if (DocumentPolicy.isKYCRole(user)) {
      // No additional document_type or uploaded_by_id restriction.
    } else if (DocumentPolicy.isManagement(user)) {
      where.document_type = { notIn: KYC_DOCUMENT_TYPES };
    } else {
      where.uploaded_by_id = user.employeeId;
      where.document_type = { notIn: KYC_DOCUMENT_TYPES };
    }

    if (filters.customer_id) where.customer_id = filters.customer_id;
    if (filters.lead_id) where.lead_id = filters.lead_id;
    if (filters.opportunity_id) where.opportunity_id = filters.opportunity_id;
    if (filters.booking_id) where.booking_id = filters.booking_id;
    if (filters.property_id) where.property_id = filters.property_id;
    if (filters.project_id) where.project_id = filters.project_id;
    if (filters.payment_id) where.payment_id = filters.payment_id;
    if (filters.document_type) where.document_type = filters.document_type;
    if (filters.status) where.status = filters.status;
    if (filters.verification_status) where.verification_status = filters.verification_status;

    const [documents, total] = await Promise.all([
      p.document.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          document_code: true,
          document_type: true,
          title: true,
          original_name: true,
          mime_type: true,
          file_size: true,
          status: true,
          verification_status: true,
          verified_at: true,
          uploaded_by_id: true,
          created_at: true,
          updated_at: true,
          customer_id: true,
          lead_id: true,
          opportunity_id: true,
          booking_id: true,
          property_id: true,
          project_id: true,
          payment_id: true,
        },
      }),
      p.document.count({ where }),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getDocument(user: TokenPayload, documentId: number) {
    const doc = await p.document.findFirst({
      where: { id: documentId, company_id: user.companyId },
      select: {
        id: true,
        document_code: true,
        company_id: true,
        branch_id: true,
        customer_id: true,
        lead_id: true,
        opportunity_id: true,
        booking_id: true,
        property_id: true,
        project_id: true,
        payment_id: true,
        document_type: true,
        title: true,
        original_name: true,
        mime_type: true,
        file_size: true,
        status: true,
        verification_status: true,
        verified_by_id: true,
        verified_at: true,
        verification_notes: true,
        uploaded_by_id: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        version: true,
      },
    });
    if (!doc) throw { status: 404, message: 'Document not found' };

    if (!DocumentPolicy.canView(user, doc)) {
      throw { status: 403, message: 'Access denied' };
    }

    return doc;
  }

  static async downloadDocument(user: TokenPayload, documentId: number) {
    const doc = await p.document.findFirst({ where: { id: documentId, company_id: user.companyId } });
    if (!doc) throw { status: 404, message: 'Document not found' };

    if (!DocumentPolicy.canDownload(user, doc)) {
      throw { status: 403, message: 'Access denied' };
    }

    const fileBuffer = await storageService.download(doc.storage_path);

    await p.auditEvent.create({
      data: {
        actor_id: user.employeeId,
        action: 'DOCUMENT_DOWNLOADED',
        entity_type: 'DOCUMENT',
        entity_id: doc.id,
        old_value: null,
        new_value: JSON.stringify({
          document_code: doc.document_code,
          document_type: doc.document_type,
        }),
      },
    });

    return { fileBuffer, document: doc };
  }

  static async verifyDocument(
    user: TokenPayload,
    documentId: number,
    decision: 'VERIFIED' | 'REJECTED',
    notes?: string
  ) {
    const doc = await p.document.findFirst({ where: { id: documentId, company_id: user.companyId } });
    if (!doc) throw { status: 404, message: 'Document not found' };

    if (!DocumentPolicy.canVerify(user, doc)) {
      throw { status: 403, message: 'Forbidden: Cannot verify this document' };
    }

    if (doc.deleted_at) {
      throw { status: 400, message: 'Cannot verify archived document' };
    }

    if (decision === 'REJECTED' && !notes) {
      throw { status: 400, message: 'Rejection reason is required' };
    }

    const result = await p.$transaction(async (tx: any) => {
      const updated = await tx.document.updateMany({
        where: { id: documentId, version: doc.version },
        data: {
          verification_status: decision,
          verified_by_id: user.employeeId,
          verified_at: new Date(),
          verification_notes: notes || null,
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw { status: 409, message: 'Document was modified by another user. Please refresh and try again.' };
      }

const auditAction = decision === 'VERIFIED' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED';
      await tx.auditEvent.create({
        data: {
          actor_id: user.employeeId,
          action: auditAction,
          entity_type: 'DOCUMENT',
          entity_id: doc.id,
          old_value: JSON.stringify({ verification_status: doc.verification_status }),
          new_value: JSON.stringify({ verification_status: decision, notes }),
        },
      });

      // Phase 11 Packet 3C — recompute the customer's derived kyc_status from
      // KYC document verification (CRM remains the sole KYC authority).
      if (KYC_DOCUMENT_TYPES.includes(doc.document_type) && doc.customer_id) {
        await KycService.recomputeAndNotifyTx(tx, doc.customer_id, doc.company_id, user.employeeId);
      }

      return tx.document.findFirst({ where: { id: documentId, company_id: user.companyId } });
    });

    return result;
  }

  static async archiveDocument(user: TokenPayload, documentId: number, reason?: string) {
    const doc = await p.document.findFirst({ where: { id: documentId, company_id: user.companyId } });
    if (!doc) throw { status: 404, message: 'Document not found' };

    if (!DocumentPolicy.canDelete(user, doc)) {
      throw { status: 403, message: 'Forbidden: Cannot archive this document' };
    }

    if (doc.deleted_at) {
      throw { status: 400, message: 'Document is already archived' };
    }

    const result = await p.$transaction(async (tx: any) => {
      const updated = await tx.document.updateMany({
        where: { id: documentId, version: doc.version },
        data: {
          status: 'ARCHIVED',
          deleted_at: new Date(),
          deleted_by_id: user.employeeId,
          delete_reason: reason || null,
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw { status: 409, message: 'Document was modified by another user. Please refresh and try again.' };
      }

      await tx.auditEvent.create({
        data: {
          actor_id: user.employeeId,
          action: 'DOCUMENT_ARCHIVED',
          entity_type: 'DOCUMENT',
          entity_id: doc.id,
          old_value: JSON.stringify({ status: doc.status }),
          new_value: JSON.stringify({ status: 'ARCHIVED', reason }),
        },
      });

      return tx.document.findFirst({ where: { id: documentId, company_id: user.companyId } });
    });

    return result;
  }

  static async restoreDocument(user: TokenPayload, documentId: number) {
    const doc = await p.document.findFirst({ where: { id: documentId, company_id: user.companyId } });
    if (!doc) throw { status: 404, message: 'Document not found' };

    if (!DocumentPolicy.canRestore(user, doc)) {
      throw { status: 403, message: 'Forbidden: Cannot restore this document' };
    }

    if (!doc.deleted_at) {
      throw { status: 400, message: 'Document is not archived' };
    }

    const result = await p.$transaction(async (tx: any) => {
      const updated = await tx.document.updateMany({
        where: { id: documentId, version: doc.version },
        data: {
          status: 'ACTIVE',
          deleted_at: null,
          deleted_by_id: null,
          delete_reason: null,
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw { status: 409, message: 'Document was modified by another user. Please refresh and try again.' };
      }

      await tx.auditEvent.create({
        data: {
          actor_id: user.employeeId,
          action: 'DOCUMENT_RESTORED',
          entity_type: 'DOCUMENT',
          entity_id: doc.id,
          old_value: JSON.stringify({ status: doc.status }),
          new_value: JSON.stringify({ status: 'ACTIVE' }),
        },
      });

      return tx.document.findFirst({ where: { id: documentId, company_id: user.companyId } });
    });

    return result;
  }

  static async initiateESignature(user: TokenPayload, documentId: number, signers: { name: string, email: string }[]) {
    const doc = await p.document.findFirst({ where: { id: documentId, company_id: user.companyId } });
    if (!doc) throw { status: 404, message: 'Document not found' };

    // In a real application, this is where we would call DocuSign/HelloSign APIs
    // For this mock, we will generate a fake provider ID and save pending signatures
    const mockProviderId = 'mock_env_' + crypto.randomBytes(8).toString('hex');

    const result = await p.$transaction(async (tx: any) => {
      const updated = await tx.document.updateMany({
        where: { id: documentId, version: doc.version },
        data: {
          signature_status: 'PENDING_SIGNATURE',
          version: { increment: 1 },
        }
      });

      if (updated.count === 0) {
        throw { status: 409, message: 'Document was modified by another user.' };
      }

      const signatures = await Promise.all(
        signers.map(signer => 
          tx.documentSignature.create({
            data: {
              document_id: documentId,
              signer_name: signer.name,
              signer_email: signer.email,
              provider_id: mockProviderId,
              status: 'PENDING',
            }
          })
        )
      );

      await tx.auditEvent.create({
        data: {
          actor_id: user.employeeId,
          action: 'E_SIGNATURE_INITIATED',
          entity_type: 'DOCUMENT',
          entity_id: documentId,
          old_value: JSON.stringify({ signature_status: doc.signature_status }),
          new_value: JSON.stringify({ signature_status: 'PENDING_SIGNATURE', provider_id: mockProviderId }),
        }
      });

      return { document: doc, signatures, provider_id: mockProviderId };
    });

    return result;
  }

  static async handleESignatureWebhook(providerId: string, eventType: string, signerEmail: string) {
    // Mock webhook handler for e-signature callbacks
    if (eventType !== 'signer_signed') return;

    const signature = await p.documentSignature.findFirst({
      where: { provider_id: providerId, signer_email: signerEmail }
    });

    if (!signature) return;

    await p.$transaction(async (tx: any) => {
      await tx.documentSignature.update({
        where: { id: signature.id },
        data: {
          status: 'SIGNED',
          signed_at: new Date(),
          ip_address: '127.0.0.1', // Mock IP
          audit_trail_hash: crypto.randomBytes(32).toString('hex'), // Mock hash
        }
      });

      // Check if all signatures for this document are complete
      const pendingSigs = await tx.documentSignature.count({
        where: {
          document_id: signature.document_id,
          status: 'PENDING',
        }
      });

      if (pendingSigs === 0) {
        const doc = await tx.document.findUnique({ where: { id: signature.document_id } });
        if (doc) {
          await tx.document.update({
            where: { id: signature.document_id },
            data: {
              signature_status: 'SIGNED',
              version: { increment: 1 },
            }
          });

          await tx.auditEvent.create({
            data: {
              actor_id: doc.uploaded_by_id, // System action technically, but assigning to uploader
              action: 'E_SIGNATURE_COMPLETED',
              entity_type: 'DOCUMENT',
              entity_id: signature.document_id,
              old_value: JSON.stringify({ signature_status: doc.signature_status }),
              new_value: JSON.stringify({ signature_status: 'SIGNED' }),
            }
          });
        }
      } else {
        const doc = await tx.document.findUnique({ where: { id: signature.document_id } });
        if (doc && doc.signature_status !== 'PARTIALLY_SIGNED') {
          await tx.document.update({
            where: { id: signature.document_id },
            data: {
              signature_status: 'PARTIALLY_SIGNED',
              version: { increment: 1 },
            }
          });
        }
      }
    });
  }
}
