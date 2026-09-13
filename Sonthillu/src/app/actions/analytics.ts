import { CRM_CONFIG } from '@/lib/constants';
import { getOrCreateAnonId } from '@/lib/analytics/anonId';

// Was a Server Action reading cookies()/verifySession() — incompatible with
// `output: 'export'`. Now posts directly to the CRM's WebsiteActivityEvent
// endpoint (`/public/sonthillu/activity/track`), optionally authenticated
// with a WebsiteAccount Bearer token so events land on the right account
// instead of only the anonymous id.

export type ActivityEventPayload = {
  eventName: string;
  page?: string | null;
  propertyId?: number | null;
  projectId?: number | null;
  searchContext?: any;
  metadata?: any;
};

const TOKEN_STORAGE_KEY = 'sonthillu_website_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function trackActivityEventAction(payload: ActivityEventPayload) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_CRM_API_BASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_CRM_API_KEY;
    if (!baseUrl || !apiKey) return;

    const token = getStoredToken();
    const anonymousId = token ? undefined : (getOrCreateAnonId() ?? undefined);

    await fetch(`${baseUrl}/public/${CRM_CONFIG.brandParameter}/activity/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        event_name: payload.eventName,
        page: payload.page ?? undefined,
        property_id: payload.propertyId ?? undefined,
        project_id: payload.projectId ?? undefined,
        anonymous_id: anonymousId,
        search_context: payload.searchContext,
        metadata: payload.metadata,
      }),
      // Tracking should never slow down or fail the caller.
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Failed to track activity event:', error);
  }
}
