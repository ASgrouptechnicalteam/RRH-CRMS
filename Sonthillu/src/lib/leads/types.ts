import type { PropertyType } from '@/types/search';

/**
 * Website enquiry/lead domain types for the Sonthillu conversion layer.
 *
 * CRM remains the lead source of truth. The website submits resolved, validated
 * references (property/project IDs) plus minimum contact context through the
 * server-side lead service — never raw browser data, never CRM internals.
 */

export type EnquiryType =
  | 'PROPERTY_ENQUIRY'
  | 'PROJECT_ENQUIRY'
  | 'MULTI_PROPERTY_ENQUIRY'
  | 'CALLBACK_REQUEST'
  | 'GENERAL_ENQUIRY'
  | 'SELLER_ENQUIRY';

export type PreferredContactTime = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
}

/** Campaign attribution the CRM currently supports (utm_term/content pending). */
export interface UtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface BaseEnquiry {
  contact: ContactInfo;
  preferredContactTime?: PreferredContactTime;
  message?: string;
  consent: boolean;
  utm?: UtmParams;
  /** Client-generated per-form-session identifier; repeated retries reuse it. */
  idempotencyKey?: string;
}

export interface PropertyEnquiry extends BaseEnquiry {
  propertyId: number;
}

export interface ProjectEnquiry extends BaseEnquiry {
  projectId: number;
}

export interface MultiPropertyEnquiry extends BaseEnquiry {
  propertyIds: number[];
}

export interface CallbackRequest extends BaseEnquiry {
  context?: {
    propertyId?: number;
    projectId?: number;
  };
}

export interface GeneralEnquiry extends BaseEnquiry {}

export interface SellerEnquiry extends BaseEnquiry {
  propertyType: PropertyType;
  location: string;
  expectedPrice?: number;
}

/** Payload sent to the CRM public lead endpoint (brand scoped by URL path). */
export interface CrmLeadPayload {
  customer_name: string;
  phone: string;
  email?: string;
  property_type_preference?: string;
  preferred_location?: string;
  budget_max?: number;
  notes?: string;
  enquiry_type: 'appraisal' | 'call' | 'project' | 'property' | 'consultation' | 'other';
  preferred_contact_time?: 'immediate' | 'business_hours' | 'after_hours' | 'anytime';
  property_ids?: number[];
  project_id?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface CrmLeadSubmission {
  leadId: number;
  leadCode?: string;
}

export interface LeadSubmissionResult {
  leadId: number;
  referenceNumber?: string;
  /** Resolved property IDs actually submitted (multi-property enquiry). */
  submittedPropertyIds?: number[];
  /** Selected property IDs that are no longer publicly available. */
  unavailablePropertyIds?: number[];
}

export type LeadErrorCode =
  | 'VALIDATION_ERROR'
  | 'PROPERTY_NOT_FOUND'
  | 'PROPERTY_UNAVAILABLE'
  | 'PROJECT_NOT_FOUND'
  | 'ALL_PROPERTIES_UNAVAILABLE'
  | 'CRM_UNAVAILABLE'
  | 'CRM_REJECTED'
  | 'RATE_LIMITED';

export class LeadError extends Error {
  readonly code: LeadErrorCode;
  readonly userMessage: string;
  readonly retryable: boolean;

  constructor(code: LeadErrorCode, userMessage: string, retryable: boolean) {
    super(userMessage);
    this.name = 'LeadError';
    this.code = code;
    this.userMessage = userMessage;
    this.retryable = retryable;
  }
}

export function isLeadError(error: unknown): error is LeadError {
  return error instanceof LeadError;
}

/** Mapping of website property types to the CRM's established vocabulary. */
const PROPERTY_TYPE_TO_CRM: Record<PropertyType, string> = {
  APARTMENT: 'APARTMENT',
  VILLA: 'RESIDENTIAL_VILLA',
  INDEPENDENT_HOUSE: 'INDEPENDENT_HOUSE',
};

export function mapPropertyTypeToCrm(category: string): string | undefined {
  return PROPERTY_TYPE_TO_CRM[category as PropertyType];
}
