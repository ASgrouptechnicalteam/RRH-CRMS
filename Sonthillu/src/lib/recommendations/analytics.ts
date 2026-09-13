import type { RecommendationType } from './types';

/**
 * Analytics event contract for the Search Recommendation Engine.
 * Fired on the client; a future analytics provider can subscribe to the
 * documented custom event. No network call is made by this foundation.
 */
export type RecommendationEventType =
  | 'recommendation_impression'
  | 'recommendation_click'
  | 'recommendation_shortlist'
  | 'recommendation_compare'
  | 'recommendation_enquiry';

export type RecommendationSurface = 'search' | 'property_detail' | 'homepage';

export interface RecommendationEventPayload {
  eventType: RecommendationEventType;
  propertyId: number;
  groupType: RecommendationType;
  rankWithinGroup: number;
  surface: RecommendationSurface;
  sessionId?: string;
  timestamp: string;
}

export const RECOMMENDATION_EVENT_NAME = 'sonthillu:recommendation';

const RECENTLY_VIEWED_KEY = 'sonthillu:recentlyViewed';
const DEFAULT_RECENTLY_VIEWED_LIMIT = 8;

export function buildRecommendationEvent(
  eventType: RecommendationEventType,
  input: Omit<RecommendationEventPayload, 'eventType' | 'timestamp'>
): RecommendationEventPayload {
  return { ...input, eventType, timestamp: new Date().toISOString() };
}

/**
 * Dispatch a typed recommendation event. Client-only; no-op on the server.
 * Analytics providers can subscribe via:
 *   window.addEventListener(RECOMMENDATION_EVENT_NAME, handler)
 */
export function trackRecommendationEvent(payload: RecommendationEventPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(RECOMMENDATION_EVENT_NAME, { detail: payload }));
}

/* ============================================================================
 * RECENTLY-VIEWED FOUNDATION
 * Session-scoped (localStorage) list used to feed the RECENTLY_VIEWED group.
 * ==========================================================================*/

export function readRecentlyViewedIds(max: number = DEFAULT_RECENTLY_VIEWED_LIMIT): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    return parsed
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      .slice(0, max);
  } catch {
    return [];
  }
}

/** Record a property view (most-recent first) and return the new list. */
export function recordRecentlyViewed(
  propertyId: number,
  max: number = DEFAULT_RECENTLY_VIEWED_LIMIT
): number[] {
  if (typeof window === 'undefined') return [];
  const ids = [propertyId, ...readRecentlyViewedIds(max).filter((id) => id !== propertyId)].slice(
    0,
    max
  );
  try {
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
  } catch {
    // storage unavailable (e.g., private mode) — non-fatal
  }
  return ids;
}
