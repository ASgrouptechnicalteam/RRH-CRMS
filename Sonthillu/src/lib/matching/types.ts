import type { PublicProperty } from '@/types/search';

/**
 * Constraint type of a requirement — controls eligibility and ranking semantics.
 * This is DISTINCT from the user-specified priority of a requirement.
 */
export type RequirementImportance =
  | 'HARD' // eligibility gate: mismatch excludes the candidate
  | 'STRONG_PREFERENCE'
  | 'SOFT_PREFERENCE'
  | 'FLEXIBLE'
  | 'EXCLUDED' // value is explicitly unwanted: match excludes the candidate
  | 'UNKNOWN';

/**
 * User-specified relative priority of a requirement within a single query.
 * Determines how much a requirement's satisfaction contributes to the
 * aggregate score compared to other requirements in the SAME RequirementModel.
 */
export type RequirementPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type RequirementFlexibility = 'LOW' | 'MEDIUM' | 'HIGH';

export type RequirementOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'BETWEEN'
  | 'IN'
  | 'CONTAINS'
  | 'EXCLUDES';

export interface Requirement {
  field: string;
  operator: RequirementOperator;
  value: unknown;
  importance: RequirementImportance;
  /** Query-specific priority. Defaults to LOW if omitted. */
  priority?: RequirementPriority;
  flexibility?: RequirementFlexibility;
  /** e.g., budget stretch percentage (0.15 = 15%). */
  tolerance?: number;
}

export interface RequirementModel {
  requirements: Requirement[];
  rawQuery?: string;
  confidence?: number;
}

/**
 * Result of a single field evaluation.
 * The evaluator decides satisfaction and status; it NEVER decides the
 * user's priority (priority is applied later during aggregation).
 */
export type FieldEvaluationStatus =
  'MATCH' | 'PARTIAL' | 'MISMATCH' | 'UNKNOWN' | 'MISSING' | 'NOT_APPLICABLE';

export interface FieldEvaluation {
  /** Normalized satisfaction in [0, 1]. */
  satisfaction: number;
  status: FieldEvaluationStatus;
  reason: string;
  matchedValue?: unknown;
  requestedValue?: unknown;
  deviation?: unknown;
}

export type MatchBand = 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'RELATED' | 'NO_MATCH';

export type ResultTier = 'PRIMARY' | 'CLOSE' | 'RELATED' | 'NO_MATCH';

export interface MatchExplanation {
  score: number; // 0 to 1
  band: MatchBand;
  matched: string[];
  partial: string[];
  deviations: string[];
  unknown: string[];
  missing: string[];
  notApplicable: string[];
}

export interface RankedProperty<T> {
  property: T;
  score: number;
  tier: ResultTier;
  explanation: MatchExplanation;
}

/**
 * Candidate input to the matching engine.
 * Extends the public property DTO with optional fields that the engine may
 * evaluate (price range, parking flag, floor). All fields are optional and
 * the engine remains independent of the UI / CRM / AI provider.
 */
export interface MatchCandidate extends PublicProperty {
  priceMin?: number;
  priceMax?: number;
  parking?: boolean | 'UNKNOWN' | 'NOT_APPLICABLE';
  floor?: number | null;
  state?: string | null;
  city?: string | null;
  locality?: string | null;
}
