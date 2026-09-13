import type {
  MatchCandidate,
  RankedProperty,
  RequirementModel,
  ResultTier,
} from '@/lib/matching/types';
import type { PropertyType, PublicPropertyDetail, SearchQuery } from '@/types/search';

/**
 * Recommendation groups produced by the Search Recommendation Engine (Packet 7).
 *
 * The engine does NOT rank on its own: every ranked candidate is ranked by the
 * approved Packet 6 Match & Ranking Engine. This module only classifies the
 * engine output into deterministic groups and packages it for the UI.
 */
export type RecommendationType =
  | 'SIMILAR'
  | 'CLOSE_MATCH'
  | 'ABOVE_BUDGET'
  | 'NEARBY'
  | 'ALTERNATIVE_TYPE'
  | 'RECENTLY_VIEWED'
  | 'POPULAR'
  | 'NO_RESULT_RECOVERY';

export interface RecommendationItemMetadata {
  /** True when the property is outside the user's budget (clearly labeled). */
  priceAboveBudget?: boolean;
  /** Absolute amount above the budget ceiling, when computable. */
  priceAboveBy?: number;
  /** Structured-geo relation used to justify a NEARBY recommendation. */
  locationRelation?: 'SAME_CITY';
  /** Alternative type: source property type (the user's request). */
  alternativeFrom?: PropertyType;
  /** Alternative type: the recommended property type. */
  alternativeTo?: PropertyType;
  /** Primary field that deviates from the user's request. */
  deviationField?: string;
}

export interface RecommendationItem<T = MatchCandidate> {
  property: T;
  type: RecommendationType;
  /** Packet 6 engine score (0-1) under this item's group ranking model. */
  engineScore: number;
  /** Packet 6 result tier under this item's group ranking model. */
  engineTier: ResultTier;
  /** 1-based position within its group. */
  rankWithinGroup: number;
  /** Short human-readable reasons shown with the card. */
  reasons: string[];
  metadata: RecommendationItemMetadata;
}

export interface RecommendationGroup<T = MatchCandidate> {
  type: RecommendationType;
  title: string;
  description: string;
  items: RecommendationItem<T>[];
}

export interface RecommendationContext {
  /** The source search query (canonical, URL-serializable). */
  primaryQuery: SearchQuery;
  /** Packet 6 RequirementModel built from the query or the primary property. */
  primaryModel: RequirementModel;
  /** Reference property for property-detail recommendations (optional). */
  primaryProperty?: PublicPropertyDetail | null;
  /** Property ids that must never appear (e.g., the current primary property). */
  excludeIds?: number[];
  /** Recently-viewed property ids (session / localStorage), most-recent first. */
  recentlyViewedIds?: number[];
  /** Popular property ids (future analytics signal). Falls back to newest-first. */
  popularIds?: number[];
  /** Test seam: fixed ISO timestamp for deterministic output. */
  now?: string;
}

export interface RecommendationResult<T = MatchCandidate> {
  groups: RecommendationGroup<T>[];
  total: number;
  primaryQuery: SearchQuery;
  generatedAt: string;
}

/* ============================================================================
 * DETERMINISTIC CONFIGURATION
 * ==========================================================================*/

/** Maximum items rendered per recommendation group. */
export const MAX_ITEMS_PER_GROUP = 4;

/** Maximum items rendered by the NO_RESULT_RECOVERY group. */
export const MAX_NO_RESULT_ITEMS = 4;

/**
 * Valid alternative property types. An APARTMENT is never automatically
 * offered as an alternative; only VILLA <-> INDEPENDENT_HOUSE are considered
 * interchangeable in V1.
 */
export const VALID_ALTERNATIVE_TYPES: Record<PropertyType, PropertyType[]> = {
  APARTMENT: [],
  VILLA: ['INDEPENDENT_HOUSE'],
  INDEPENDENT_HOUSE: ['VILLA'],
};

/** Output ordering of groups (deterministic). */
export const GROUP_ORDER: RecommendationType[] = [
  'SIMILAR',
  'CLOSE_MATCH',
  'ABOVE_BUDGET',
  'ALTERNATIVE_TYPE',
  'NEARBY',
  'RECENTLY_VIEWED',
  'POPULAR',
  'NO_RESULT_RECOVERY',
];

export const GROUP_LABELS: Record<RecommendationType, { title: string; description: string }> = {
  SIMILAR: {
    title: 'Similar properties in your preferred location',
    description: 'Properties matching your primary criteria with only minor differences.',
  },
  CLOSE_MATCH: {
    title: 'Close matches',
    description: 'Strong matches that differ on one or two secondary criteria.',
  },
  ABOVE_BUDGET: {
    title: 'Properties slightly above your budget',
    description: 'These meet your other criteria but exceed your stated budget.',
  },
  ALTERNATIVE_TYPE: {
    title: 'Alternative property types you may consider',
    description: 'A different property type that still meets your other requirements.',
  },
  NEARBY: {
    title: 'Nearby properties in the same city',
    description: 'In your city or locality, with slightly different specifics.',
  },
  RECENTLY_VIEWED: {
    title: 'Recently viewed',
    description: 'Properties you looked at earlier in this session.',
  },
  POPULAR: {
    title: 'Popular with other buyers',
    description: 'Frequently viewed and shortlisted properties in our portfolio.',
  },
  NO_RESULT_RECOVERY: {
    title: 'Here are some properties you may be interested in',
    description: "While we didn't find exact matches, these alternatives might catch your eye.",
  },
};

/** Re-export for pipeline consumers. */
export type { RankedProperty };
