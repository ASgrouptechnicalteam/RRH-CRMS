import { ZodError } from 'zod';
import { isValidPropertyId } from '../customer/types';
import {
  callbackRequestSchema,
  multiPropertyEnquirySchema,
  projectEnquirySchema,
  propertyEnquirySchema,
  generalEnquirySchema,
  sellerEnquirySchema,
} from './schemas';
import { LeadError, mapPropertyTypeToCrm } from './types';
import type { CrmLeadPayload, CrmLeadSubmission, LeadSubmissionResult } from './types';
import type { Property } from '../../types/property';
import type { Project } from '../../types/project';

/**
 * Client-side lead service — runs in the browser (static export has no
 * server to host `lib/leads/service.ts`'s Redis-backed rate limiting and
 * idempotency stores; `ioredis` cannot bundle for the client at all).
 * De-duplication and rate limiting for public leads are handled server-side
 * by apps/api instead (`publicWriteLimiter` + `createLead`'s own duplicate
 * detection — see the consolidation plan's Decision 2), so this layer only
 * validates, resolves property/project references, and submits.
 */

export interface LeadClientDeps {
  submitToCrm: (payload: CrmLeadPayload) => Promise<CrmLeadSubmission>;
  getPropertyById: (id: number) => Promise<Property | null>;
  getProjectById: (id: number) => Promise<Project | null>;
}

export interface LeadClientContext {
  identity?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
}

function toUserMessage(error: unknown): LeadError {
  if (error instanceof ZodError) {
    const first = error.issues[0]?.message;
    return new LeadError(
      'VALIDATION_ERROR',
      first || 'Please check the details you entered.',
      false
    );
  }
  return new LeadError('VALIDATION_ERROR', 'Please check the details you entered.', false);
}

function applyIdentity(
  contact: { name: string; phone: string; email?: string },
  identity?: LeadClientContext['identity']
): { name: string; phone: string; email?: string } {
  if (!identity) return contact;
  return {
    name: identity.name || contact.name,
    phone: identity.phone || contact.phone,
    email: identity.email || contact.email,
  };
}

function enrichFromProperty(payload: CrmLeadPayload, property: Property): CrmLeadPayload {
  const propertyType = mapPropertyTypeToCrm(property.category);
  return {
    ...payload,
    ...(propertyType ? { property_type_preference: propertyType } : {}),
    ...(property.location ? { preferred_location: property.location } : {}),
    ...(typeof property.price === 'number' ? { budget_max: property.price } : {}),
  };
}

function enrichFromProject(payload: CrmLeadPayload, project: Project): CrmLeadPayload {
  return {
    ...payload,
    ...(project.location ? { preferred_location: project.location } : {}),
  };
}

function mapContactTime(
  time?: 'MORNING' | 'AFTERNOON' | 'EVENING'
): 'immediate' | 'business_hours' | 'after_hours' | 'anytime' | undefined {
  if (time === 'MORNING' || time === 'AFTERNOON') return 'business_hours';
  if (time === 'EVENING') return 'after_hours';
  return undefined;
}

export function createLeadClientService(deps: LeadClientDeps) {
  const { submitToCrm, getPropertyById, getProjectById } = deps;

  async function submit(payload: CrmLeadPayload): Promise<LeadSubmissionResult> {
    try {
      const submission = await submitToCrm(payload);
      return { leadId: submission.leadId, referenceNumber: submission.leadCode };
    } catch (error) {
      if (error instanceof LeadError) throw error;
      throw new LeadError(
        'CRM_UNAVAILABLE',
        'We could not reach our team right now. Please try again shortly.',
        true
      );
    }
  }

  async function createPropertyEnquiry(
    raw: unknown,
    ctx: LeadClientContext = {}
  ): Promise<LeadSubmissionResult> {
    let parsed;
    try {
      parsed = propertyEnquirySchema.parse(raw);
    } catch (error) {
      throw toUserMessage(error);
    }

    const property = await getPropertyById(parsed.propertyId);
    if (!property) {
      throw new LeadError(
        'PROPERTY_UNAVAILABLE',
        'This property is no longer available. Please choose another property.',
        false
      );
    }

    const contact = applyIdentity(parsed.contact, ctx.identity);
    const payload = enrichFromProperty(
      {
        customer_name: contact.name,
        phone: contact.phone,
        email: contact.email || undefined,
        enquiry_type: 'property',
        property_ids: [property.id],
        ...(parsed.preferredContactTime
          ? { preferred_contact_time: mapContactTime(parsed.preferredContactTime) }
          : {}),
        ...(parsed.message ? { notes: parsed.message } : {}),
        ...(parsed.utm?.utmSource ? { utm_source: parsed.utm.utmSource } : {}),
        ...(parsed.utm?.utmMedium ? { utm_medium: parsed.utm.utmMedium } : {}),
        ...(parsed.utm?.utmCampaign ? { utm_campaign: parsed.utm.utmCampaign } : {}),
      },
      property
    );

    return submit(payload);
  }

  async function createProjectEnquiry(
    raw: unknown,
    ctx: LeadClientContext = {}
  ): Promise<LeadSubmissionResult> {
    let parsed;
    try {
      parsed = projectEnquirySchema.parse(raw);
    } catch (error) {
      throw toUserMessage(error);
    }

    const project = await getProjectById(parsed.projectId);
    if (!project) {
      throw new LeadError(
        'PROJECT_NOT_FOUND',
        'This project is no longer available. Please choose another project.',
        false
      );
    }

    const contact = applyIdentity(parsed.contact, ctx.identity);
    const payload = enrichFromProject(
      {
        customer_name: contact.name,
        phone: contact.phone,
        email: contact.email || undefined,
        enquiry_type: 'project',
        project_id: project.id,
        ...(parsed.preferredContactTime
          ? { preferred_contact_time: mapContactTime(parsed.preferredContactTime) }
          : {}),
        ...(parsed.message ? { notes: parsed.message } : {}),
        ...(parsed.utm?.utmSource ? { utm_source: parsed.utm.utmSource } : {}),
        ...(parsed.utm?.utmMedium ? { utm_medium: parsed.utm.utmMedium } : {}),
        ...(parsed.utm?.utmCampaign ? { utm_campaign: parsed.utm.utmCampaign } : {}),
      },
      project
    );

    return submit(payload);
  }

  async function createMultiPropertyEnquiry(
    raw: unknown,
    ctx: LeadClientContext = {}
  ): Promise<LeadSubmissionResult> {
    let parsed;
    try {
      parsed = multiPropertyEnquirySchema.parse(raw);
    } catch (error) {
      throw toUserMessage(error);
    }

    const uniqueIds = [...new Set(parsed.propertyIds.filter(isValidPropertyId))];

    const eligible: Property[] = [];
    const unavailable: number[] = [];
    for (const id of uniqueIds) {
      const property = await getPropertyById(id);
      if (property) eligible.push(property);
      else unavailable.push(id);
    }

    if (eligible.length === 0) {
      throw new LeadError(
        'ALL_PROPERTIES_UNAVAILABLE',
        'The properties you selected are no longer available. Please choose other properties.',
        false
      );
    }

    const contact = applyIdentity(parsed.contact, ctx.identity);
    const first = eligible[0];
    const base: CrmLeadPayload = {
      customer_name: contact.name,
      phone: contact.phone,
      email: contact.email || undefined,
      enquiry_type: 'property',
      property_ids: eligible.map((p) => p.id),
      ...(parsed.preferredContactTime
        ? { preferred_contact_time: mapContactTime(parsed.preferredContactTime) }
        : {}),
      ...(parsed.message ? { notes: parsed.message } : {}),
      ...(parsed.utm?.utmSource ? { utm_source: parsed.utm.utmSource } : {}),
      ...(parsed.utm?.utmMedium ? { utm_medium: parsed.utm.utmMedium } : {}),
      ...(parsed.utm?.utmCampaign ? { utm_campaign: parsed.utm.utmCampaign } : {}),
    };
    const payload = enrichFromProperty(base, first);

    const result = await submit(payload);
    return {
      ...result,
      submittedPropertyIds: eligible.map((p) => p.id),
      unavailablePropertyIds: unavailable,
    };
  }

  async function createCallbackRequest(
    raw: unknown,
    ctx: LeadClientContext = {}
  ): Promise<LeadSubmissionResult> {
    let parsed;
    try {
      parsed = callbackRequestSchema.parse(raw);
    } catch (error) {
      throw toUserMessage(error);
    }

    let property: Property | null = null;
    if (parsed.context?.propertyId) {
      property = await getPropertyById(parsed.context.propertyId);
      if (!property)
        throw new LeadError('PROPERTY_UNAVAILABLE', 'This property is no longer available.', false);
    }

    let project: Project | null = null;
    if (parsed.context?.projectId) {
      project = await getProjectById(parsed.context.projectId);
      if (!project)
        throw new LeadError('PROJECT_NOT_FOUND', 'This project is no longer available.', false);
    }

    const contact = applyIdentity(parsed.contact, ctx.identity);
    let payload: CrmLeadPayload = {
      customer_name: contact.name,
      phone: contact.phone,
      email: contact.email || undefined,
      enquiry_type: 'call',
      ...(parsed.preferredContactTime
        ? { preferred_contact_time: mapContactTime(parsed.preferredContactTime) }
        : {}),
      ...(parsed.message ? { notes: parsed.message } : {}),
      ...(property ? { property_ids: [property.id] } : {}),
      ...(project ? { project_id: project.id } : {}),
      ...(parsed.utm?.utmSource ? { utm_source: parsed.utm.utmSource } : {}),
      ...(parsed.utm?.utmMedium ? { utm_medium: parsed.utm.utmMedium } : {}),
      ...(parsed.utm?.utmCampaign ? { utm_campaign: parsed.utm.utmCampaign } : {}),
    };

    if (property) payload = enrichFromProperty(payload, property);
    if (project) payload = enrichFromProject(payload, project);

    return submit(payload);
  }

  async function createGeneralEnquiry(
    raw: unknown,
    ctx: LeadClientContext = {}
  ): Promise<LeadSubmissionResult> {
    let parsed;
    try {
      parsed = generalEnquirySchema.parse(raw);
    } catch (error) {
      throw toUserMessage(error);
    }

    const contact = applyIdentity(parsed.contact, ctx.identity);
    const payload: CrmLeadPayload = {
      customer_name: contact.name,
      phone: contact.phone,
      email: contact.email || undefined,
      enquiry_type: 'consultation',
      ...(parsed.preferredContactTime
        ? { preferred_contact_time: mapContactTime(parsed.preferredContactTime) }
        : {}),
      ...(parsed.message ? { notes: parsed.message } : {}),
      ...(parsed.utm?.utmSource ? { utm_source: parsed.utm.utmSource } : {}),
      ...(parsed.utm?.utmMedium ? { utm_medium: parsed.utm.utmMedium } : {}),
      ...(parsed.utm?.utmCampaign ? { utm_campaign: parsed.utm.utmCampaign } : {}),
    };

    return submit(payload);
  }

  async function createSellerEnquiry(
    raw: unknown,
    ctx: LeadClientContext = {}
  ): Promise<LeadSubmissionResult> {
    let parsed;
    try {
      parsed = sellerEnquirySchema.parse(raw);
    } catch (error) {
      throw toUserMessage(error);
    }

    const contact = applyIdentity(parsed.contact, ctx.identity);
    const propertyTypeMapped = mapPropertyTypeToCrm(parsed.propertyType);

    const payload: CrmLeadPayload = {
      customer_name: contact.name,
      phone: contact.phone,
      email: contact.email || undefined,
      enquiry_type: 'appraisal',
      preferred_location: parsed.location,
      ...(propertyTypeMapped ? { property_type_preference: propertyTypeMapped } : {}),
      ...(typeof parsed.expectedPrice === 'number' ? { budget_max: parsed.expectedPrice } : {}),
      ...(parsed.preferredContactTime
        ? { preferred_contact_time: mapContactTime(parsed.preferredContactTime) }
        : {}),
      ...(parsed.message ? { notes: parsed.message } : {}),
      ...(parsed.utm?.utmSource ? { utm_source: parsed.utm.utmSource } : {}),
      ...(parsed.utm?.utmMedium ? { utm_medium: parsed.utm.utmMedium } : {}),
      ...(parsed.utm?.utmCampaign ? { utm_campaign: parsed.utm.utmCampaign } : {}),
    };

    return submit(payload);
  }

  return {
    createPropertyEnquiry,
    createProjectEnquiry,
    createMultiPropertyEnquiry,
    createCallbackRequest,
    createGeneralEnquiry,
    createSellerEnquiry,
  };
}
