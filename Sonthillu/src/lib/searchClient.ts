import type { SearchQuery, PublicProperty } from '@/types/search';
import type { RecommendationGroup } from '@/lib/recommendations/types';
import { CRM_CONFIG } from '@/lib/constants';
import { getOrCreateAnonId } from '@/lib/analytics/anonId';

// Client-side replacement for lib/search.ts's executeSearch (which proxied
// to the retiring Sonthillu-Backend BFF's own /api/search). Calls apps/api's
// WebsiteAccount search endpoint directly — see consolidation plan Decision
// 5. Runs entirely in the browser (static export has no server at request
// time to do this search-and-render step for us).
//
// The CRM endpoint doesn't paginate server-side (it ranks/returns up to 300
// candidates in one call) — `page`/`limit` are applied by slicing here,
// same result the old "pagination will be implemented in a future update"
// placeholder was already promising, just implemented now.

export interface SearchServiceResult {
  properties: PublicProperty[];
  total: number;
  recommendations: RecommendationGroup[];
  error: string | null;
  isGlobalEmpty: boolean;
}

const TOKEN_STORAGE_KEY = 'sonthillu_website_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getCrmUrl() {
  return process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'http://localhost:3000/api/v1';
}
function getCrmApiKey() {
  return process.env.NEXT_PUBLIC_CRM_API_KEY || '';
}

export async function executeSearch(
  query: SearchQuery,
  anonIdOverride?: string
): Promise<SearchServiceResult> {
  const params = new URLSearchParams();
  if (query.location) params.set('location', query.location);
  if (query.propertyType) params.set('propertyType', query.propertyType);
  if (query.listingType && query.listingType !== 'ANY')
    params.set('listingType', query.listingType);
  if (query.minBudget !== undefined) params.set('minBudget', String(query.minBudget));
  if (query.maxBudget !== undefined) params.set('maxBudget', String(query.maxBudget));
  if (query.possessionStatus && query.possessionStatus !== 'ANY')
    params.set('possessionStatus', query.possessionStatus);
  if (query.bedrooms !== undefined) params.set('bedrooms', String(query.bedrooms));
  if (query.sortBy) params.set('sortBy', query.sortBy);

  const anonId = anonIdOverride ?? getOrCreateAnonId();
  if (anonId) params.set('anonId', anonId);

  const token = getStoredToken();
  const url = `${getCrmUrl()}/public/${CRM_CONFIG.brandParameter}/search?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': getCrmApiKey(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`Search API failed with status: ${response.status}`);
    }
    const data = (await response.json()) as {
      properties: PublicProperty[];
      total: number;
      recommendations: RecommendationGroup[];
      error: string | null;
      isGlobalEmpty: boolean;
    };

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 12;
    const start = (page - 1) * limit;
    const paged = data.properties.slice(start, start + limit);

    return { ...data, properties: paged, total: data.properties.length };
  } catch (error) {
    console.error('Frontend executeSearch failed:', error);
    return {
      properties: [],
      total: 0,
      recommendations: [],
      error: 'Failed to fetch search results.',
      isGlobalEmpty: false,
    };
  }
}
