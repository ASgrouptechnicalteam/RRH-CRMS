// NOTE: This is a client-only module (browser). The server action is lazy-loaded
// to avoid pulling prisma / next/headers into the Vitest module graph during unit tests.
// Dynamic require works because this file is only ever executed in the browser runtime.

/**
 * Normalized event types required for P6.
 */
export type NormalizedActivityEvent =
  | 'page_view'
  | 'search_started'
  | 'search_submitted'
  | 'property_view'
  | 'shortlist_added'
  | 'shortlist_removed'
  | 'compare_added'
  | 'compare_removed'
  | 'enquiry_started'
  | 'enquiry_submitted'
  | 'call_now_clicked'
  | 'recommendation_impression'
  | 'recommendation_click'
  | 'recommendation_property_view'
  | 'recommendation_shortlist'
  | 'recommendation_compare'
  | 'recommendation_enquiry'
  | 'ai_search_started'
  | 'ai_query_submitted'
  | 'ai_interpretation_succeeded'
  | 'ai_interpretation_failed'
  | 'ai_clarification_requested'
  | 'ai_clarification_answered'
  | 'ai_results_shown'
  | 'ai_result_clicked'
  | 'ai_result_shortlisted'
  | 'ai_result_compared'
  | 'ai_result_enquired'
  | 'ai_search_refined'
  | 'ai_search_failed';

export type ActivityTrackerPayload = {
  eventName: NormalizedActivityEvent;
  page?: string;
  propertyId?: number;
  projectId?: number;
  searchContext?: any;
  metadata?: any;
};

// Simple debouncer for high-frequency events (like page views or repeated interactions)
const eventCache = new Map<string, number>();
const DEBOUNCE_MS = 5000;

function getEventFingerprint(payload: ActivityTrackerPayload): string {
  return `${payload.eventName}-${payload.propertyId || ''}-${payload.page || ''}`;
}

export function trackClientActivity(payload: ActivityTrackerPayload) {
  // 1. Throttle logic for certain events
  const fingerprint = getEventFingerprint(payload);
  const now = Date.now();
  const lastTime = eventCache.get(fingerprint) || 0;

  const isDebouncedEvent = ['page_view', 'property_view'].includes(payload.eventName);

  if (isDebouncedEvent && now - lastTime < DEBOUNCE_MS) {
    // Ignore duplicate event within the debounce window
    return;
  }

  // Record time for throttling
  eventCache.set(fingerprint, now);

  // 2. Fire and Forget via dynamic import (avoids pulling next/headers into Vitest graph)
  import('../../app/actions/analytics')
    .then(({ trackActivityEventAction }) => {
      trackActivityEventAction({
        eventName: payload.eventName,
        page:
          payload.page || (typeof window !== 'undefined' ? window.location.pathname : undefined),
        propertyId: payload.propertyId,
        projectId: payload.projectId,
        searchContext: payload.searchContext,
        metadata: payload.metadata,
      });
    })
    .catch(() => {
      // Ignore network failures for tracking
    });
}
