import { ZodError } from 'zod';
import { createRateLimiter } from '../auth/ratelimit';
import { isValidPropertyId } from '../customer/types';
import { createIdempotencyStore, hashPayload, type AsyncIdempotencyStore } from './idempotency';
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
 * Server-side lead service. The only layer the UI/server actions talk to for
 * enquiry creation. Resolves and validates property/project references, applies
 * authenticated customer identity (never browser-supplied), enriches the CRM
 * payload, enforces rate limiting and idempotency, then submits to the CRM.
 */

export interface LeadServiceDeps {
  submitToCrm: (payload: CrmLeadPayload) => Promise<CrmLeadSubmission>;
  getPropertyById: (id: number) => Promise<Property | null>;
  getProjectById: (id: number) => Promise<Project | null>;
  now?: () => number;
}

export interface LeadServiceContext {
  ip?: string;
  customer?: {
    displayName?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
}

export interface LeadServiceOptions {
  rateLimitWindowMs?: number;
  rateLimitMax?: number;
  idempotencyStore?: AsyncIdempotencyStore;
}

export interface LeadService {
  createPropertyEnquiry(raw: unknown, ctx?: LeadServiceContext): Promise<LeadSubmissionResult>;
  createProjectEnquiry(raw: unknown, ctx?: LeadServiceContext): Promise<LeadSubmissionResult>;
  createMultiPropertyEnquiry(raw: unknown, ctx?: LeadServiceContext): Promise<LeadSubmissionResult>;
  createCallbackRequest(raw: unknown, ctx?: LeadServiceContext): Promise<LeadSubmissionResult>;
  createGeneralEnquiry(raw: unknown, ctx?: LeadServiceContext): Promise<LeadSubmissionResult>;
  createSellerEnquiry(raw: unknown, ctx?: LeadServiceContext): Promise<LeadSubmissionResult>;
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

export function createLeadService(
  deps: LeadServiceDeps,
  options: LeadServiceOptions = {}
): LeadService {
  const { submitToCrm, getPropertyById, getProjectById } = deps;
  const idempotencyStore: AsyncIdempotencyStore =
    options.idempotencyStore ?? createIdempotencyStore();
  const limiter = createRateLimiter({
    windowMs: options.rateLimitWindowMs ?? 15 * 60 * 1000,
    max: options.rateLimitMax ?? 10,
    keyPrefix: 'leads:',
  });

  function applyIdentity(
    contact: { name: string; phone: string; email?: string },
    customer?: LeadServiceContext['customer']
  ): { name: string; phone: string; email?: string } {
    if (!customer) return contact;
    return {
      name: customer.displayName || contact.name,
      phone: customer.phone || contact.phone,
      email: customer.email || contact.email,
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

  async function guardAndSubmit(
    rawKey: string | undefined,
    canonical: unknown,
    payload: CrmLeadPayload,
    ctx: LeadServiceContext
  ): Promise<LeadSubmissionResult> {
    const key = rawKey && rawKey.length >= 8 ? rawKey : hashPayload(canonical);

    // Identity strategy: Authenticated > Trusted IP > Anonymous Global
    const rateKey = ctx.customer?.phone || ctx.customer?.email || ctx.ip || 'anonymous-global';

    const rateLimitResult = await limiter.check(rateKey, deps.now?.());
    if (!rateLimitResult.allowed) {
      throw new LeadError('RATE_LIMITED', 'Too many requests. Please try again later.', true);
    }

    const existing = await idempotencyStore.get(key);
    if (existing) {
      return {
        leadId: existing.leadId as number,
        referenceNumber: existing.referenceNumber,
      };
    }

    try {
      const submission = await submitToCrm(payload);

      await idempotencyStore.set(key, {
        leadId: submission.leadId,
        referenceNumber: submission.leadCode,
        createdAt: deps.now?.() ?? Date.now(),
      });

      return {
        leadId: submission.leadId,
        referenceNumber: submission.leadCode,
      } as LeadSubmissionResult;
    } catch (error) {
      await idempotencyStore.delete(key);
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
    ctx: LeadServiceContext = {}
  ): Promise<LeadSubmissionResult> {
    let parsed: {
      propertyId: number;
      contact: { name: string; phone: string; email?: string };
      preferredContactTime?: 'MORNING' | 'AFTERNOON' | 'EVENING';
      message?: string;
      utm?: { utmSource?: string; utmMedium?: string; utmCampaign?: string };
      idempotencyKey?: string;
    };
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

    const contact = applyIdentity(parsed.contact, ctx.customer);
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

    return guardAndSubmit(
      parsed.idempotencyKey,
      { type: 'PROPERTY_ENQUIRY', payload },
      payload,
      ctx
    );
  }

  async function createProjectEnquiry(
    raw: unknown,
    ctx: LeadServiceContext = {}
  ): Promise<LeadSubmissionResult> {
    let parsed: {
      projectId: number;
      contact: { name: string; phone: string; email?: string };
      preferredContactTime?: 'MORNING' | 'AFTERNOON' | 'EVENING';
      message?: string;
      utm?: { utmSource?: string; utmMedium?: string; utmCampaign?: string };
      idempotencyKey?: string;
    };
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

    const contact = applyIdentity(parsed.contact, ctx.customer);
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

    return guardAndSubmit(
      parsed.idempotencyKey,
      { type: 'PROJECT_ENQUIRY', payload },
      payload,
      ctx
    );
  }

  async function createMultiPropertyEnquiry(
    raw: unknown,
    ctx: LeadServiceContext = {}
  ): Promise<LeadSubmissionResult> {
    let parsed: {
      propertyIds: number[];
      contact: { name: string; phone: string; email?: string };
      preferredContactTime?: 'MORNING' | 'AFTERNOON' | 'EVENING';
      message?: string;
      utm?: { utmSource?: string; utmMedium?: string; utmCampaign?: string };
      idempotencyKey?: string;
    };
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
      if (property) {
        eligible.push(property);
      } else {
        unavailable.push(id);
      }
    }

    if (eligible.length === 0) {
      throw new LeadError(
        'ALL_PROPERTIES_UNAVAILABLE',
        'The properties you selected are no longer available. Please choose other properties.',
        false
      );
    }

    const contact = applyIdentity(parsed.contact, ctx.customer);
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

    const result = await guardAndSubmit(
      parsed.idempotencyKey,
      { type: 'MULTI_PROPERTY_ENQUIRY', payload },
      payload,
      ctx
    );

    return {
      ...result,
      submittedPropertyIds: eligible.map((p) => p.id),
      unavailablePropertyIds: unavailable,
    };
  }

  async function createCallbackRequest(
    raw: unknown,
    ctx: LeadServiceContext = {}
  ): Promise<LeadSubmissionResult> {
    let parsed: {
      contact: { name: string; phone: string; email?: string };
      preferredContactTime?: 'MORNING' | 'AFTERNOON' | 'EVENING';
      message?: string;
      utm?: { utmSource?: string; utmMedium?: string; utmCampaign?: string };
      idempotencyKey?: string;
      context?: { propertyId?: number; projectId?: number };
    };
    try {
      parsed = callbackRequestSchema.parse(raw);
    } catch (error) {
      throw toUserMessage(error);
    }

    let property: Property | null = null;
    if (parsed.context?.propertyId) {
      property = await getPropertyById(parsed.context.propertyId);
      if (!property) {
        throw new LeadError('PROPERTY_UNAVAILABLE', 'This property is no longer available.', false);
      }
    }

    let project: Project | null = null;
    if (parsed.context?.projectId) {
      project = await getProjectById(parsed.context.projectId);
      if (!project) {
        throw new LeadError('PROJECT_NOT_FOUND', 'This project is no longer available.', false);
      }
    }

    const contact = applyIdentity(parsed.contact, ctx.customer);
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

    return guardAndSubmit(
      parsed.idempotencyKey,
      { type: 'CALLBACK_REQUEST', payload },
      payload,
      ctx
    );
  }

  async function createGeneralEnquiry(
    raw: unknown,
    ctx: LeadServiceContext = {}
  ): Promise<LeadSubmissionResult> {
    let parsed: {
      contact: { name: string; phone: string; email?: string };
      preferredContactTime?: 'MORNING' | 'AFTERNOON' | 'EVENING';
      message?: string;
      utm?: { utmSource?: string; utmMedium?: string; utmCampaign?: string };
      idempotencyKey?: string;
    };
    try {
      parsed = generalEnquirySchema.parse(raw);
    } catch (error) {
      throw toUserMessage(error);
    }

    const contact = applyIdentity(parsed.contact, ctx.customer);
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

    return guardAndSubmit(
      parsed.idempotencyKey,
      { type: 'GENERAL_ENQUIRY', payload },
      payload,
      ctx
    );
  }

  async function createSellerEnquiry(
    raw: unknown,
    ctx: LeadServiceContext = {}
  ): Promise<LeadSubmissionResult> {
    let parsed: {
      contact: { name: string; phone: string; email?: string };
      propertyType: 'APARTMENT' | 'VILLA' | 'INDEPENDENT_HOUSE';
      location: string;
      expectedPrice?: number;
      preferredContactTime?: 'MORNING' | 'AFTERNOON' | 'EVENING';
      message?: string;
      utm?: { utmSource?: string; utmMedium?: string; utmCampaign?: string };
      idempotencyKey?: string;
    };
    try {
      parsed = sellerEnquirySchema.parse(raw);
    } catch (error) {
      throw toUserMessage(error);
    }

    const contact = applyIdentity(parsed.contact, ctx.customer);
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

    return guardAndSubmit(parsed.idempotencyKey, { type: 'SELLER_ENQUIRY', payload }, payload, ctx);
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
