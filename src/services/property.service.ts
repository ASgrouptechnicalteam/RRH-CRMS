import { PrismaClient, Property } from '@prisma/client';
import { TokenPayload } from '../utils/jwt';
import { Roles } from '@rrh-ems/shared';
import { can } from '../authz/authorization';
import { Permissions } from '@rrh-ems/shared';
import { WorkflowEngine } from '../workflows/workflowEngine';
import { WorkflowDomain } from '../workflows/types';
import { PropertyPolicy } from '../policies/property.policy';
import { buildPropertyScope } from '../authz/dataScope';

const prisma = new PrismaClient();
const p = prisma as any;

export class PropertyService {
  private static async generateNextPropertyCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await p.property.count();
    const seq = (count + 1).toString().padStart(4, '0');
    return `RRH-PR-${currentYear}-${seq}`;
  }

  static async listProperties(user: TokenPayload, filters: { brand?: string; status?: string }) {
    const whereCondition = await buildPropertyScope(user);
    
    if (filters.brand) {
      whereCondition.brand_type = filters.brand;
    }
    if (filters.status) {
      whereCondition.status = filters.status;
    }

    return await p.property.findMany({
      where: whereCondition,
      include: {
        assigned_pm: { select: { id: true, employee_code: true, full_name: true, phone: true } },
        created_by: { select: { id: true, employee_code: true, full_name: true } },
        images: true,
        verification_logs: {
          orderBy: { created_at: 'desc' },
          include: { actor: { select: { id: true, employee_code: true, full_name: true } } },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  static async createProperty(user: TokenPayload, data: any) {
    if (!can(user, Permissions.PROPERTIES_CREATE)) {
      throw { status: 403, message: 'Forbidden: Missing properties.create permission' };
    }

    const companyId = user.companyId || 1;
    const branchId = user.branchId || 1;
    const employeeId = user.employeeId || 1;

    const propertyCode = await this.generateNextPropertyCode();

    let finalPmId = data.assigned_pm_id;
    if (!finalPmId) {
      const pm = await p.employee.findFirst({
        where: {
          company_id: companyId,
          status: 'ACTIVE',
          roles: { some: { role: { name: Roles.PROJECT_MANAGER } } },
        },
      });
      if (pm) finalPmId = pm.id;
    }

    return await p.$transaction(async (tx: any) => {
      const property = await tx.property.create({
        data: {
          property_code: propertyCode,
          company_id: companyId,
          branch_id: branchId,
          title: data.title,
          description: data.description || null,
          brand_type: data.brand_type,
          category: data.category,
          price: data.price,
          area_sqft: data.area_sqft,
          location: data.location,
          address: data.address || null,
          bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
          bathrooms: data.bathrooms ? Number(data.bathrooms) : null,
          facing: data.facing || null,
          amenities: data.amenities || null,
          possession_status: data.possession_status || null,
          details: data.details || null,
          assigned_pm_id: finalPmId,
          status: 'PENDING_VERIFICATION',
          created_by_id: employeeId,
        },
      });

      if (data.faqs && Array.isArray(data.faqs) && data.faqs.length > 0) {
        await tx.propertyFAQ.createMany({
          data: data.faqs.map((f: any) => ({
            property_id: property.id,
            question: f.question,
            answer: f.answer,
          }))
        });
      }

      await tx.propertyVerificationLog.create({
        data: {
          property_id: property.id,
          actor_id: employeeId,
          from_status: 'DRAFT',
          to_status: 'PENDING_VERIFICATION',
          notes: `Property ${propertyCode} submitted. Assigned to PM ID ${finalPmId || 'Queue'} for On-Site Verification.`,
        },
      });

      return property;
    });
  }

  static async verifyProperty(user: TokenPayload, propertyId: number, data: { approved: boolean; notes: string }) {
    const property = await p.property.findUnique({ where: { id: propertyId } });
    if (!property) throw { status: 404, message: 'Property not found' };

    if (!can(user, Permissions.PROPERTIES_VERIFY, property)) {
      throw { status: 403, message: 'Forbidden: Insufficient permissions or out of scope' };
    }

    const transition = WorkflowEngine.canTransition({
      domain: WorkflowDomain.PROPERTY,
      currentState: property.status,
      action: 'VERIFY',
      actor: user,
      entity: property,
    });

    if (!transition.allowed) {
      throw { status: 409, message: transition.reason || 'Invalid state transition' };
    }

    const nextStatus = data.approved ? 'PENDING_DM_POLISH' : 'REJECTED';

    return await p.$transaction(async (tx: any) => {
      const updated = await tx.property.update({
        where: { id: propertyId },
        data: {
          status: nextStatus,
          verified_by_pm_at: data.approved ? new Date() : null,
          rejection_reason: data.approved ? null : data.notes,
        },
      });

      await tx.propertyVerificationLog.create({
        data: {
          property_id: propertyId,
          actor_id: user.employeeId,
          from_status: property.status,
          to_status: nextStatus,
          notes: `PM On-Site Verification: ${data.approved ? 'PASSED' : 'REJECTED'}. Notes: ${data.notes}`,
        },
      });

      return updated;
    });
  }

  static async dmPolishProperty(user: TokenPayload, propertyId: number, data: any) {
    const property = await p.property.findUnique({ where: { id: propertyId } });
    if (!property) throw { status: 404, message: 'Property not found' };

    if (!can(user, Permissions.PROPERTIES_DM_POLISH, property)) {
      throw { status: 403, message: 'Forbidden: Insufficient permissions or out of scope' };
    }

    const transition = WorkflowEngine.canTransition({
      domain: WorkflowDomain.PROPERTY,
      currentState: property.status,
      action: 'DM_POLISH',
      actor: user,
      entity: property,
    });

    if (!transition.allowed) {
      throw { status: 409, message: transition.reason || 'Invalid state transition' };
    }

    return await p.$transaction(async (tx: any) => {
      const updated = await tx.property.update({
        where: { id: propertyId },
        data: {
          status: 'PENDING_MD_APPROVAL',
          seo_title: data.seo_title || property.seo_title,
          seo_keywords: data.seo_keywords || property.seo_keywords,
          description: data.description || property.description,
          dm_polished_at: new Date(),
        },
      });

      await tx.propertyVerificationLog.create({
        data: {
          property_id: propertyId,
          actor_id: user.employeeId,
          from_status: property.status,
          to_status: 'PENDING_MD_APPROVAL',
          notes: `Digital Marketing Polish Completed. Submitted for MD Final Approval.${data.notes ? ` Notes: ${data.notes}` : ''}`,
        },
      });

      return updated;
    });
  }

  static async mdApproveProperty(user: TokenPayload, propertyId: number, data: { approved: boolean; comments?: string }) {
    const property = await p.property.findUnique({ where: { id: propertyId } });
    if (!property) throw { status: 404, message: 'Property not found' };

    if (!can(user, Permissions.PROPERTIES_MD_APPROVE, property)) {
      throw { status: 403, message: 'Forbidden: Insufficient permissions or out of scope' };
    }

    const transition = WorkflowEngine.canTransition({
      domain: WorkflowDomain.PROPERTY,
      currentState: property.status,
      action: 'MD_APPROVE',
      actor: user,
      entity: property,
    });

    if (!transition.allowed) {
      throw { status: 409, message: transition.reason || 'Invalid state transition' };
    }

    const nextStatus = data.approved ? 'LIVE' : 'REJECTED';

    return await p.$transaction(async (tx: any) => {
      const updated = await tx.property.update({
        where: { id: propertyId },
        data: {
          status: nextStatus,
          md_approved_at: data.approved ? new Date() : null,
          rejection_reason: data.approved ? null : data.comments,
        },
      });

      await tx.propertyVerificationLog.create({
        data: {
          property_id: propertyId,
          actor_id: user.employeeId,
          from_status: property.status,
          to_status: nextStatus,
          notes: `MD Decision: ${data.approved ? 'APPROVED & LIVE' : 'REJECTED'}.${data.comments ? ` Comments: ${data.comments}` : ''}`,
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_id: user.employeeId,
          action: data.approved ? 'PROPERTY_MD_APPROVED_LIVE' : 'PROPERTY_MD_REJECTED',
          entity_type: 'PROPERTY',
          entity_id: propertyId,
          old_value: JSON.stringify({ status: property.status }),
          new_value: JSON.stringify({ status: nextStatus, comments: data.comments }),
        },
      });

      return updated;
    });
  }
}
