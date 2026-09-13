/**
 * Typed analytics event contract for customer shortlist/compare activity.
 * Fired on the client; a future analytics provider can subscribe to the
 * documented custom event. No network call is made by this foundation.
 * Events never contain customer PII — only property IDs and activity counts.
 */
export type CustomerActivityEventType =
  'shortlist_add' | 'shortlist_remove' | 'compare_add' | 'compare_remove' | 'compare_view';

export type CustomerActivitySurface =
  'property_card' | 'property_detail' | 'shortlist_page' | 'compare_page';

export interface CustomerActivityPayload {
  eventType: CustomerActivityEventType;
  propertyId?: number;
  activityCount?: number;
  surface?: CustomerActivitySurface;
  timestamp: string;
}

export const CUSTOMER_ACTIVITY_EVENT_NAME = 'sonthillu:customer-activity';

export function buildCustomerActivityEvent(
  eventType: CustomerActivityEventType,
  input: Omit<CustomerActivityPayload, 'eventType' | 'timestamp'>
): CustomerActivityPayload {
  return { ...input, eventType, timestamp: new Date().toISOString() };
}

import { trackClientActivity } from '../analytics/activity';

export function trackCustomerActivityEvent(payload: CustomerActivityPayload): void {
  if (typeof window === 'undefined') return;
  // Keep the custom event for any other analytics
  window.dispatchEvent(new CustomEvent(CUSTOMER_ACTIVITY_EVENT_NAME, { detail: payload }));

  // Map to P6 Normalized Events
  const eventMap: Record<CustomerActivityEventType, string> = {
    shortlist_add: 'shortlist_added',
    shortlist_remove: 'shortlist_removed',
    compare_add: 'compare_added',
    compare_remove: 'compare_removed',
    compare_view: 'page_view',
  };

  const normalizedEventName = eventMap[payload.eventType] as any;
  if (!normalizedEventName) return;

  trackClientActivity({
    eventName: normalizedEventName,
    propertyId: payload.propertyId,
    metadata: { surface: payload.surface, count: payload.activityCount },
  });
}
