import type { EnquiryType } from './types';

/**
 * Typed analytics event contract for the website conversion layer (enquiry,
 * request a call, call now). Fired on the client; a future analytics provider
 * can subscribe to the documented custom event. No network call is made by this
 * foundation. Events never contain customer PII — only enquiry type, surface and
 * property/project references.
 */
export type LeadEventType =
  | 'enquiry_started'
  | 'enquiry_submitted'
  | 'enquiry_failed'
  | 'request_call_started'
  | 'request_call_submitted'
  | 'call_now_clicked'
  | 'multi_property_enquiry_started'
  | 'multi_property_enquiry_submitted'
  | 'general_enquiry_started'
  | 'general_enquiry_submitted'
  | 'seller_enquiry_started'
  | 'seller_enquiry_submitted';

export type LeadSurface =
  | 'property_detail'
  | 'project_detail'
  | 'shortlist_page'
  | 'compare_page'
  | 'contact_page'
  | 'homepage'
  | 'sell_property_page';

export interface LeadEventPayload {
  eventType: LeadEventType;
  enquiryType?: EnquiryType;
  surface?: LeadSurface;
  propertyId?: number;
  projectId?: number;
  propertyCount?: number;
  timestamp: string;
}

export const LEAD_EVENT_NAME = 'sonthillu:lead-activity';

export function buildLeadEvent(
  eventType: LeadEventType,
  input: Omit<LeadEventPayload, 'eventType' | 'timestamp'>
): LeadEventPayload {
  return { ...input, eventType, timestamp: new Date().toISOString() };
}

export function trackLeadEvent(payload: LeadEventPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LEAD_EVENT_NAME, { detail: payload }));
}
