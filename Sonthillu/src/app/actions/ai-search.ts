import { CRM_CONFIG } from '@/lib/constants';
import { executeSearch } from '@/lib/searchClient';
import { trackActivityEventAction } from './analytics';
import type { SearchQuery } from '@/types/search';

// Was a Server Action calling a local Gemini-based provider (lib/ai/client)
// plus lib/search.ts's BFF proxy — both retired. Now calls apps/api's
// WebsiteAccount AI search endpoints directly (`/search/parse` then
// `/search`), per the consolidation plan's Decision 5. The CRM's parser is
// simpler than the old local one — no multi-turn CLARIFICATION loop, no
// listingType extraction — so that branch is now unreachable; kept in the
// response shape only so AISearchInterface.tsx doesn't need to change.

function getCrmUrl() {
  return process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'http://localhost:3000/api/v1';
}
function getCrmApiKey() {
  return process.env.NEXT_PUBLIC_CRM_API_KEY || '';
}

interface ParsedSearchQuery {
  location: string | null;
  propertyType:
    | 'APARTMENT'
    | 'VILLA'
    | 'INDEPENDENT_HOUSE'
    | 'PLOT'
    | 'COMMERCIAL'
    | 'OFFICE'
    | 'RETAIL'
    | 'WAREHOUSE'
    | null;
  bedrooms: string | null;
  minBudget: number | null;
  maxBudget: number | null;
  possessionStatus: 'READY_TO_MOVE' | 'UNDER_CONSTRUCTION' | null;
}

function toSearchQuery(parsed: ParsedSearchQuery): SearchQuery {
  const query: SearchQuery = {};
  if (parsed.location) query.location = parsed.location;
  if (
    parsed.propertyType === 'APARTMENT' ||
    parsed.propertyType === 'VILLA' ||
    parsed.propertyType === 'INDEPENDENT_HOUSE'
  ) {
    query.propertyType = parsed.propertyType;
  }
  if (parsed.bedrooms) {
    const n = Number(parsed.bedrooms);
    if (!isNaN(n)) query.bedrooms = n;
  }
  if (parsed.minBudget != null) query.minBudget = parsed.minBudget;
  if (parsed.maxBudget != null) query.maxBudget = parsed.maxBudget;
  if (parsed.possessionStatus) query.possessionStatus = parsed.possessionStatus;
  return query;
}

export async function submitAISearch(input: string, _contextState: any) {
  if (!input || input.trim().length === 0) {
    return { error: 'Query is empty' };
  }
  if (input.length > 500) {
    return { error: 'Query exceeds maximum length of 500 characters' };
  }

  await trackActivityEventAction({
    eventName: 'ai_search_started',
    metadata: { inputLength: input.length },
  });

  let parsed: ParsedSearchQuery;
  try {
    const res = await fetch(`${getCrmUrl()}/public/${CRM_CONFIG.brandParameter}/search/parse`, {
      method: 'POST',
      headers: { 'x-api-key': getCrmApiKey(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: input }),
      cache: 'no-store',
    });
    if (res.status === 429) {
      await trackActivityEventAction({
        eventName: 'ai_interpretation_failed',
        metadata: { error: 'AI_PROVIDER_RATE_LIMIT' },
      });
      return { error: 'AI_PROVIDER_RATE_LIMIT' };
    }
    if (res.status === 503) {
      await trackActivityEventAction({
        eventName: 'ai_interpretation_failed',
        metadata: { error: 'AI_PROVIDER_UNCONFIGURED' },
      });
      return { status: 'FALLBACK', error: 'AI_PROVIDER_UNCONFIGURED' };
    }
    if (!res.ok) {
      await trackActivityEventAction({
        eventName: 'ai_interpretation_failed',
        metadata: { status: res.status },
      });
      return { status: 'FALLBACK', error: 'AI_PROVIDER_ERROR' };
    }
    parsed = await res.json();
  } catch {
    await trackActivityEventAction({
      eventName: 'ai_interpretation_failed',
      metadata: { error: 'network' },
    });
    return { status: 'FALLBACK', error: 'AI_PROVIDER_UNCONFIGURED' };
  }

  await trackActivityEventAction({
    eventName: 'ai_interpretation_succeeded',
    metadata: { query: toSearchQuery(parsed), rawIntent: parsed },
  });

  const query = toSearchQuery(parsed);
  const searchResult = await executeSearch(query);

  await trackActivityEventAction({
    eventName: 'ai_results_shown',
    metadata: {
      resultCount: searchResult.total,
      hasRecommendations: searchResult.recommendations.length > 0,
      isGlobalEmpty: searchResult.isGlobalEmpty,
    },
  });

  return {
    status: 'RESULTS',
    query,
    results: searchResult.properties,
    recommendations: searchResult.recommendations,
    total: searchResult.total,
    isGlobalEmpty: searchResult.isGlobalEmpty,
    rawIntent: parsed,
  };
}
