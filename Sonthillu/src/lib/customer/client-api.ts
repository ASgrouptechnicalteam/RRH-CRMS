import { hydratePropertiesByIds, type HydrationResult } from './service';
import type { Property } from '../../types/property';

// Was a proxy through this app's own Next.js Route Handler
// (app/api/properties/route.ts) — removed, since a Route Handler reading
// dynamic request data (the ?ids= query) cannot exist under
// `output: 'export'` (consolidation plan, Decision 5). Calls the CRM
// directly now, same as everything else in lib/crm.ts.
function getCrmUrl() {
  return process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'http://localhost:3000/api/v1';
}
function getCrmApiKey() {
  return process.env.NEXT_PUBLIC_CRM_API_KEY || '';
}

async function fetchPropertyByIdClient(id: number): Promise<Property | null> {
  try {
    const res = await fetch(`${getCrmUrl()}/public/sonthillu/properties/${id}`, {
      headers: { 'x-api-key': getCrmApiKey() },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as Property;
  } catch {
    return null;
  }
}

/**
 * Client-side hydration of stored property IDs against the current CRM
 * public property source. Never duplicates authoritative property data —
 * only used to render the current public state of stored references
 * (shortlist/compare) against whatever is live right now.
 */
export async function fetchPropertiesForIds(ids: number[]): Promise<HydrationResult> {
  if (ids.length === 0) {
    return { properties: [], unavailableIds: [] };
  }
  return hydratePropertiesByIds(ids, fetchPropertyByIdClient);
}
