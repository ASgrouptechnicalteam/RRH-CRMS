import {
  GUEST_COMPARE_KEY,
  GUEST_SHORTLIST_KEY,
  isValidPropertyId,
  type StorageLike,
} from './types';

/**
 * Guest (anonymous) temporary shortlist/compare state, persisted in the
 * browser. Only non-sensitive property IDs are stored — never authentication
 * or session data. All functions accept an injected StorageLike so they are
 * pure and fully testable without a browser.
 */

export function parseIdList(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidPropertyId);
  } catch {
    return [];
  }
}

function serializeIdList(ids: number[]): string {
  return JSON.stringify(ids);
}

export function readGuestShortlist(storage: StorageLike): number[] {
  return parseIdList(storage.getItem(GUEST_SHORTLIST_KEY));
}

export function removeGuestShortlist(storage: StorageLike, propertyId: number): number[] {
  const ids = readGuestShortlist(storage).filter((id) => id !== propertyId);
  storage.setItem(GUEST_SHORTLIST_KEY, serializeIdList(ids));
  return ids;
}

export function toggleGuestShortlist(
  storage: StorageLike,
  propertyId: number
): { ids: number[]; added: boolean } {
  if (!isValidPropertyId(propertyId)) return { ids: readGuestShortlist(storage), added: false };
  const ids = readGuestShortlist(storage);
  if (ids.includes(propertyId)) {
    const next = ids.filter((id) => id !== propertyId);
    storage.setItem(GUEST_SHORTLIST_KEY, serializeIdList(next));
    return { ids: next, added: false };
  }
  const next = [propertyId, ...ids];
  storage.setItem(GUEST_SHORTLIST_KEY, serializeIdList(next));
  return { ids: next, added: true };
}

export type GuestCompareAddStatus = 'added' | 'already_present' | 'limit_reached';

export function readGuestCompare(storage: StorageLike): number[] {
  return parseIdList(storage.getItem(GUEST_COMPARE_KEY));
}

export function addGuestCompare(
  storage: StorageLike,
  propertyId: number,
  limit: number
): { ids: number[]; status: GuestCompareAddStatus } {
  const ids = readGuestCompare(storage);
  if (!isValidPropertyId(propertyId)) return { ids, status: 'already_present' };
  if (ids.includes(propertyId)) return { ids, status: 'already_present' };
  if (ids.length >= limit) return { ids, status: 'limit_reached' };
  const next = [...ids, propertyId];
  storage.setItem(GUEST_COMPARE_KEY, serializeIdList(next));
  return { ids: next, status: 'added' };
}

export function removeGuestCompare(storage: StorageLike, propertyId: number): number[] {
  const ids = readGuestCompare(storage).filter((id) => id !== propertyId);
  storage.setItem(GUEST_COMPARE_KEY, serializeIdList(ids));
  return ids;
}

export function replaceGuestCompare(
  storage: StorageLike,
  index: number,
  propertyId: number,
  limit: number
): number[] {
  const ids = readGuestCompare(storage);
  if (!isValidPropertyId(propertyId)) return ids;
  if (index < 0 || index >= ids.length) return ids;
  const removed = ids.filter((_, i) => i !== index);
  const deduped = removed.filter((id) => id !== propertyId);
  const safeIndex = Math.min(index, deduped.length);
  const next = [...deduped.slice(0, safeIndex), propertyId, ...deduped.slice(safeIndex)].slice(
    0,
    limit
  );
  storage.setItem(GUEST_COMPARE_KEY, serializeIdList(next));
  return next;
}

export function clearGuestCompare(storage: StorageLike): void {
  storage.removeItem(GUEST_COMPARE_KEY);
}
