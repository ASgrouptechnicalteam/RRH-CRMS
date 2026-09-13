import { toPublicPropertyDetail } from '../dto';
import { assertValidPropertyId, isValidPropertyId, type CustomerActivityStore } from './types';
import type { Property } from '../../types/property';
import type { PublicPropertyDetail } from '../../types/search';

export const COMPARE_LIMIT = 4;

export type ShortlistAddResult = 'added' | 'already_present';

export async function addToShortlist(
  store: CustomerActivityStore,
  customerId: number,
  propertyId: unknown
): Promise<ShortlistAddResult> {
  assertValidPropertyId(propertyId);
  if (await store.hasShortlist(customerId, propertyId)) return 'already_present';
  await store.addShortlist(customerId, propertyId);
  return 'added';
}

export async function removeFromShortlist(
  store: CustomerActivityStore,
  customerId: number,
  propertyId: unknown
): Promise<boolean> {
  assertValidPropertyId(propertyId);
  if (!(await store.hasShortlist(customerId, propertyId))) return false;
  await store.removeShortlist(customerId, propertyId);
  return true;
}

export async function getShortlist(
  store: CustomerActivityStore,
  customerId: number
): Promise<number[]> {
  return store.listShortlist(customerId);
}

export async function isShortlisted(
  store: CustomerActivityStore,
  customerId: number,
  propertyId: unknown
): Promise<boolean> {
  assertValidPropertyId(propertyId);
  return store.hasShortlist(customerId, propertyId);
}

export type CompareAddResult = 'added' | 'already_present' | 'limit_reached';

export async function addToCompare(
  store: CustomerActivityStore,
  customerId: number,
  propertyId: unknown
): Promise<CompareAddResult> {
  assertValidPropertyId(propertyId);
  const current = await store.listCompare(customerId);
  if (current.includes(propertyId)) return 'already_present';
  if (current.length >= COMPARE_LIMIT) return 'limit_reached';
  await store.setCompare(customerId, [...current, propertyId]);
  return 'added';
}

export async function removeFromCompare(
  store: CustomerActivityStore,
  customerId: number,
  propertyId: unknown
): Promise<boolean> {
  assertValidPropertyId(propertyId);
  const current = await store.listCompare(customerId);
  if (!current.includes(propertyId)) return false;
  await store.setCompare(
    customerId,
    current.filter((id) => id !== propertyId)
  );
  return true;
}

export async function replaceInCompare(
  store: CustomerActivityStore,
  customerId: number,
  index: number,
  propertyId: unknown
): Promise<boolean> {
  assertValidPropertyId(propertyId);
  const current = await store.listCompare(customerId);
  if (!Number.isInteger(index) || index < 0 || index >= current.length) {
    return false;
  }
  const removed = current.filter((_, i) => i !== index);
  const deduped = removed.filter((id) => id !== propertyId);
  const safeIndex = Math.min(index, deduped.length);
  const next = [...deduped.slice(0, safeIndex), propertyId, ...deduped.slice(safeIndex)].slice(
    0,
    COMPARE_LIMIT
  );
  await store.setCompare(customerId, next);
  return true;
}

export async function clearCompare(
  store: CustomerActivityStore,
  customerId: number
): Promise<void> {
  await store.clearCompare(customerId);
}

export async function getCompare(
  store: CustomerActivityStore,
  customerId: number
): Promise<number[]> {
  return store.listCompare(customerId);
}

export async function isCompared(
  store: CustomerActivityStore,
  customerId: number,
  propertyId: unknown
): Promise<boolean> {
  assertValidPropertyId(propertyId);
  const current = await store.listCompare(customerId);
  return current.includes(propertyId);
}

export async function setCustomerCompare(
  store: CustomerActivityStore,
  customerId: number,
  propertyIds: unknown[]
): Promise<number[]> {
  const valid = propertyIds.filter(isValidPropertyId);
  const unique: number[] = [];
  for (const id of valid) {
    if (!unique.includes(id)) unique.push(id);
  }
  const capped = unique.slice(0, COMPARE_LIMIT);
  await store.setCompare(customerId, capped);
  return capped;
}

export interface HydrationResult {
  properties: PublicPropertyDetail[];
  unavailableIds: number[];
}

/**
 * Data-freshness boundary: resolves stored property IDs against the current
 * CRM/public DTO source. Properties no longer publicly available are returned
 * as unavailableIds (never presented as live). Always uses current public data.
 */
export async function hydratePropertiesByIds(
  ids: unknown[],
  fetchProperty: (id: number) => Promise<Property | null>
): Promise<HydrationResult> {
  const properties: PublicPropertyDetail[] = [];
  const unavailableIds: number[] = [];
  const seen = new Set<number>();

  for (const rawId of ids) {
    if (!isValidPropertyId(rawId)) continue;
    if (seen.has(rawId)) continue;
    seen.add(rawId);

    const raw = await fetchProperty(rawId);
    if (raw) {
      properties.push(toPublicPropertyDetail(raw));
    } else {
      unavailableIds.push(rawId);
    }
  }

  return { properties, unavailableIds };
}
