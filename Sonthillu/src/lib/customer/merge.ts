import { isValidPropertyId } from './types';
import { COMPARE_LIMIT } from './service';

/**
 * Guest → customer migration. Guest state takes priority (preserves the
 * guest's ordering and choices), then customer state is appended, deduped.
 * Never blindly overwrites customer state.
 */
export function mergeShortlistIds(guestIds: unknown[], customerIds: unknown[]): number[] {
  const seen = new Set<number>();
  const merged: number[] = [];
  for (const id of [...guestIds, ...customerIds]) {
    if (!isValidPropertyId(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }
  return merged;
}

export function mergeCompareIds(
  guestIds: unknown[],
  customerIds: unknown[],
  limit: number = COMPARE_LIMIT
): number[] {
  return mergeShortlistIds(guestIds, customerIds).slice(0, limit);
}
