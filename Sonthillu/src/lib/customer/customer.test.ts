import { describe, it, expect } from 'vitest';
import { InMemoryCustomerActivityStore } from './store';
import {
  COMPARE_LIMIT,
  addToShortlist,
  removeFromShortlist,
  getShortlist,
  isShortlisted,
  addToCompare,
  removeFromCompare,
  replaceInCompare,
  clearCompare,
  getCompare,
  isCompared,
  setCustomerCompare,
  hydratePropertiesByIds,
} from './service';
import { mergeShortlistIds, mergeCompareIds } from './merge';
import {
  readGuestShortlist,
  toggleGuestShortlist,
  removeGuestShortlist,
  readGuestCompare,
  addGuestCompare,
  removeGuestCompare,
  replaceGuestCompare,
  clearGuestCompare,
} from './guest';
import { buildCompareRows, buildCompareHeaders } from './compare';
import { buildCustomerActivityEvent, CUSTOMER_ACTIVITY_EVENT_NAME } from './activity';
import { isValidPropertyId, assertValidPropertyId, type StorageLike } from './types';
import type { Property } from '../../types/property';
import type { PublicPropertyDetail } from '../../types/search';

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

function rawProperty(id: number, overrides: Partial<Property> = {}): Property {
  return {
    id,
    property_code: `P-${id}`,
    title: `Property ${id}`,
    description: null,
    category: 'APARTMENT',
    price: 5000000,
    area_sqft: 1200,
    location: 'Hyderabad',
    address: null,
    bedrooms: 2,
    bathrooms: 2,
    facing: 'EAST',
    amenities: null,
    possession_status: 'READY_TO_MOVE',
    details: null,
    seo_title: null,
    seo_keywords: null,
    created_at: '2026-01-01T00:00:00.000Z',
    images: [],
    state: 'Telangana',
    city: 'Hyderabad',
    locality: 'Miyapur',
    pincode: '500049',
    listing_type: 'NEW',
    project: null,
    ...overrides,
  };
}

function detail(overrides: Partial<PublicPropertyDetail>): PublicPropertyDetail {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Property',
    slug: overrides.slug ?? 'P-1',
    propertyType: overrides.propertyType ?? 'APARTMENT',
    listingType: overrides.listingType ?? 'NEW',
    price: overrides.price ?? 5000000,
    priceFormatted: overrides.priceFormatted ?? '₹50 L',
    location: overrides.location ?? 'Hyderabad',
    areaSqft: overrides.areaSqft ?? 1200,
    areaFormatted: overrides.areaFormatted ?? '1,200 sq.ft',
    bedrooms: overrides.bedrooms ?? null,
    bathrooms: overrides.bathrooms ?? null,
    facing: overrides.facing ?? null,
    possessionStatus: overrides.possessionStatus ?? null,
    primaryImage: overrides.primaryImage ?? null,
    images: overrides.images ?? [],
    amenities: overrides.amenities ?? [],
    isVerified: overrides.isVerified ?? false,
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    propertyCode: overrides.propertyCode ?? 'P-1',
    description: overrides.description ?? null,
    address: overrides.address ?? null,
    details: overrides.details ?? null,
    seoTitle: overrides.seoTitle ?? null,
    seoKeywords: overrides.seoKeywords ?? null,
    state: overrides.state ?? null,
    city: overrides.city ?? null,
    locality: overrides.locality ?? null,
    pincode: overrides.pincode ?? null,
    project: overrides.project ?? null,
  };
}

describe('property id validation', () => {
  it('accepts positive integers only', () => {
    expect(isValidPropertyId(5)).toBe(true);
    expect(isValidPropertyId('5')).toBe(true);
    expect(isValidPropertyId(0)).toBe(false);
    expect(isValidPropertyId(-1)).toBe(false);
    expect(isValidPropertyId(1.5)).toBe(false);
    expect(isValidPropertyId(NaN)).toBe(false);
  });

  it('throws for invalid ids in strict validation', () => {
    expect(() => assertValidPropertyId(0)).toThrow(RangeError);
    expect(() => assertValidPropertyId('abc')).toThrow(RangeError);
    expect(() => assertValidPropertyId(42)).not.toThrow();
  });
});

describe('shortlist service', () => {
  it('adds a property and lists it most-recent-first', async () => {
    const store = new InMemoryCustomerActivityStore();
    expect(await addToShortlist(store, 1, 10)).toBe('added');
    await addToShortlist(store, 1, 20);
    expect(await getShortlist(store, 1)).toEqual([20, 10]);
  });

  it('prevents duplicate add without creating a duplicate record', async () => {
    const store = new InMemoryCustomerActivityStore();
    await addToShortlist(store, 1, 10);
    expect(await addToShortlist(store, 1, 10)).toBe('already_present');
    expect(await getShortlist(store, 1)).toEqual([10]);
  });

  it('removes a property and is idempotent', async () => {
    const store = new InMemoryCustomerActivityStore();
    await addToShortlist(store, 1, 10);
    expect(await removeFromShortlist(store, 1, 10)).toBe(true);
    expect(await removeFromShortlist(store, 1, 10)).toBe(false);
    expect(await getShortlist(store, 1)).toEqual([]);
  });

  it('reports shortlist membership', async () => {
    const store = new InMemoryCustomerActivityStore();
    await addToShortlist(store, 1, 10);
    expect(await isShortlisted(store, 1, 10)).toBe(true);
    expect(await isShortlisted(store, 1, 99)).toBe(false);
  });

  it('isolates customers: A can never read or alter B', async () => {
    const store = new InMemoryCustomerActivityStore();
    await addToShortlist(store, 1, 10);
    await addToShortlist(store, 2, 99);
    expect(await getShortlist(store, 1)).toEqual([10]);
    expect(await getShortlist(store, 2)).toEqual([99]);
    expect(await isShortlisted(store, 2, 10)).toBe(false);
    await removeFromShortlist(store, 2, 10);
    expect(await getShortlist(store, 1)).toEqual([10]);
  });

  it('rejects invalid property ids on mutation', async () => {
    const store = new InMemoryCustomerActivityStore();
    await expect(addToShortlist(store, 1, 0)).rejects.toThrow(RangeError);
    await expect(removeFromShortlist(store, 1, -1)).rejects.toThrow(RangeError);
  });
});

describe('compare service', () => {
  it('adds a property to compare in order', async () => {
    const store = new InMemoryCustomerActivityStore();
    await addToCompare(store, 1, 10);
    await addToCompare(store, 1, 20);
    expect(await getCompare(store, 1)).toEqual([10, 20]);
  });

  it('prevents duplicate compare entries', async () => {
    const store = new InMemoryCustomerActivityStore();
    await addToCompare(store, 1, 10);
    expect(await addToCompare(store, 1, 10)).toBe('already_present');
    expect(await getCompare(store, 1)).toEqual([10]);
  });

  it(`enforces the documented max of ${COMPARE_LIMIT}`, async () => {
    const store = new InMemoryCustomerActivityStore();
    for (let i = 1; i <= COMPARE_LIMIT; i += 1) {
      expect(await addToCompare(store, 1, i)).toBe('added');
    }
    expect(await addToCompare(store, 1, 99)).toBe('limit_reached');
    expect(await getCompare(store, 1)).toHaveLength(COMPARE_LIMIT);
    expect(await getCompare(store, 1)).not.toContain(99);
  });

  it('removes a property and is idempotent', async () => {
    const store = new InMemoryCustomerActivityStore();
    await addToCompare(store, 1, 10);
    expect(await removeFromCompare(store, 1, 10)).toBe(true);
    expect(await removeFromCompare(store, 1, 10)).toBe(false);
    expect(await getCompare(store, 1)).toEqual([]);
  });

  it('replaces a compared property at its index', async () => {
    const store = new InMemoryCustomerActivityStore();
    await addToCompare(store, 1, 10);
    await addToCompare(store, 1, 20);
    expect(await replaceInCompare(store, 1, 1, 30)).toBe(true);
    expect(await getCompare(store, 1)).toEqual([10, 30]);
  });

  it('dedupes the replacement id and rejects out-of-range indexes', async () => {
    const store = new InMemoryCustomerActivityStore();
    await addToCompare(store, 1, 10);
    await addToCompare(store, 1, 20);
    await addToCompare(store, 1, 30);
    expect(await replaceInCompare(store, 1, 0, 30)).toBe(true);
    expect(await getCompare(store, 1)).toEqual([30, 20]);
    expect(await replaceInCompare(store, 1, 9, 50)).toBe(false);
    expect(await replaceInCompare(store, 1, -1, 50)).toBe(false);
  });

  it('clears the whole compare list', async () => {
    const store = new InMemoryCustomerActivityStore();
    await addToCompare(store, 1, 10);
    await clearCompare(store, 1);
    expect(await getCompare(store, 1)).toEqual([]);
  });

  it('isolates compare state across customers', async () => {
    const store = new InMemoryCustomerActivityStore();
    await addToCompare(store, 1, 10);
    expect(await isCompared(store, 2, 10)).toBe(false);
    await removeFromCompare(store, 2, 10);
    expect(await getCompare(store, 1)).toEqual([10]);
  });

  it('setCustomerCompare validates, dedupes and caps', async () => {
    const store = new InMemoryCustomerActivityStore();
    const capped = await setCustomerCompare(store, 1, [0, 1, 2, 2, 3, 4, 5, 6, 7]);
    expect(capped).toEqual([1, 2, 3, 4]);
    expect(await getCompare(store, 1)).toEqual([1, 2, 3, 4]);
  });
});

describe('guest → customer merge', () => {
  it('merges guest-priority, no duplicates', () => {
    expect(mergeShortlistIds([1, 2, 3], [2, 4])).toEqual([1, 2, 3, 4]);
  });

  it('merges duplicate-heavy state without duplicates', () => {
    expect(mergeShortlistIds([1, 1, 2], [2, 2, 3])).toEqual([1, 2, 3]);
  });

  it('empty guest state keeps the customer state', () => {
    expect(mergeShortlistIds([], [5, 6])).toEqual([5, 6]);
  });

  it('empty customer state keeps the guest state', () => {
    expect(mergeShortlistIds([1, 2], [])).toEqual([1, 2]);
  });

  it('caps compare merge at the documented limit', () => {
    const guest = [1, 2, 3, 4];
    expect(mergeCompareIds(guest, [5, 6, 7, 8])).toEqual([1, 2, 3, 4]);
    expect(mergeCompareIds([1], [2, 3, 4, 5, 6], 4)).toEqual([1, 2, 3, 4]);
  });

  it('ignores invalid ids during merge', () => {
    expect(mergeShortlistIds([0, 1, NaN], [-1, 2])).toEqual([1, 2]);
  });
});

describe('guest temporary state (browser-safe property IDs)', () => {
  it('toggles a guest shortlist entry', () => {
    const storage = memoryStorage();
    expect(toggleGuestShortlist(storage, 10)).toEqual({ ids: [10], added: true });
    expect(toggleGuestShortlist(storage, 10)).toEqual({ ids: [], added: false });
    expect(readGuestShortlist(storage)).toEqual([]);
  });

  it('persists guest shortlist across reads', () => {
    const storage = memoryStorage();
    toggleGuestShortlist(storage, 10);
    toggleGuestShortlist(storage, 20);
    expect(readGuestShortlist(storage)).toEqual([20, 10]);
  });

  it('removes a guest shortlist entry and is idempotent', () => {
    const storage = memoryStorage();
    toggleGuestShortlist(storage, 10);
    toggleGuestShortlist(storage, 20);
    expect(removeGuestShortlist(storage, 10)).toEqual([20]);
    expect(removeGuestShortlist(storage, 10)).toEqual([20]);
  });

  it('guest compare respects the limit and duplicates', () => {
    const storage = memoryStorage();
    expect(addGuestCompare(storage, 1, 3).status).toBe('added');
    expect(addGuestCompare(storage, 1, 3).status).toBe('already_present');
    addGuestCompare(storage, 2, 3);
    addGuestCompare(storage, 3, 3);
    expect(addGuestCompare(storage, 4, 3).status).toBe('limit_reached');
    expect(readGuestCompare(storage)).toEqual([1, 2, 3]);
  });

  it('removes, replaces and clears guest compare', () => {
    const storage = memoryStorage();
    addGuestCompare(storage, 1, 4);
    addGuestCompare(storage, 2, 4);
    expect(removeGuestCompare(storage, 1)).toEqual([2]);
    addGuestCompare(storage, 3, 4);
    expect(replaceGuestCompare(storage, 0, 9, 4)).toEqual([9, 3]);
    clearGuestCompare(storage);
    expect(readGuestCompare(storage)).toEqual([]);
  });

  it('ignores malformed persisted state', () => {
    const storage = memoryStorage({
      'sonthillu:guest:shortlist': 'not-json',
      'sonthillu:guest:compare': JSON.stringify(['x', 1, 0, 2]),
    });
    expect(readGuestShortlist(storage)).toEqual([]);
    expect(readGuestCompare(storage)).toEqual([1, 2]);
  });

  it('never stores non-id values', () => {
    const storage = memoryStorage();
    toggleGuestShortlist(storage, 0);
    addGuestCompare(storage, -1, 4);
    expect(readGuestShortlist(storage)).toEqual([]);
    expect(readGuestCompare(storage)).toEqual([]);
  });
});

describe('data freshness (current CRM/public DTO)', () => {
  it('resolves available ids to current public DTOs and flags the rest', async () => {
    const fetcher = async (id: number): Promise<Property | null> =>
      id === 1 ? rawProperty(1) : null;
    const result = await hydratePropertiesByIds([1, 2, 3], fetcher);
    expect(result.properties.map((p) => p.id)).toEqual([1]);
    expect(result.properties[0]).toHaveProperty('propertyCode', 'P-1');
    expect(result.unavailableIds).toEqual([2, 3]);
  });

  it('never presents an unavailable property as live', async () => {
    const result = await hydratePropertiesByIds([7], async () => null);
    expect(result.properties).toEqual([]);
    expect(result.unavailableIds).toEqual([7]);
  });

  it('dedupes ids and preserves order', async () => {
    const calls: number[] = [];
    const fetcher = async (id: number): Promise<Property | null> => {
      calls.push(id);
      return rawProperty(id);
    };
    const result = await hydratePropertiesByIds([3, 1, 3, 2], fetcher);
    expect(calls).toEqual([3, 1, 2]);
    expect(result.properties.map((p) => p.id)).toEqual([3, 1, 2]);
  });

  it('skips invalid ids', async () => {
    const result = await hydratePropertiesByIds([0, -1, 1.5, 5], async (id) => rawProperty(id));
    expect(result.properties.map((p) => p.id)).toEqual([5]);
  });
});

describe('property-type-aware comparison', () => {
  const apartment = detail({
    id: 1,
    title: 'Flat A',
    propertyType: 'APARTMENT',
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1200,
    areaFormatted: '1,200 sq.ft',
    facing: 'EAST',
    possessionStatus: 'READY_TO_MOVE',
    details: { floor: 4 },
  });

  const villa = detail({
    id: 2,
    title: 'Villa B',
    propertyType: 'VILLA',
    bedrooms: 4,
    bathrooms: 3,
    areaSqft: 2400,
    areaFormatted: '2,400 sq.ft',
    facing: 'NORTH',
    possessionStatus: 'READY_TO_MOVE',
    details: { plot_area: 400, parking: 'Available' },
  });

  it('marks non-applicable fields as N/A (never 0 or "Missing")', () => {
    const rows = buildCompareRows([apartment, villa]);
    const byKey = new Map(rows.map((r) => [r.key, r]));

    const floor = byKey.get('floor')!;
    expect(floor.cells[0].status).toBe('PRESENT');
    expect(floor.cells[0].display).toBe('4');
    expect(floor.cells[1].status).toBe('NA');
    expect(floor.cells[1].display).toBe('N/A');

    const plot = byKey.get('plotArea')!;
    expect(plot.cells[0].status).toBe('NA');
    expect(plot.cells[1].status).toBe('PRESENT');
    expect(plot.cells[1].display).toBe('400 sq.ft');

    const parking = byKey.get('parking')!;
    expect(parking.cells[0].status).toBe('NA');
    expect(parking.cells[1].display).toBe('Available');
  });

  it('preserves NA vs missing distinctly', () => {
    const bareApartment = detail({ id: 3, title: 'Bare', propertyType: 'APARTMENT' });
    const noPlotVilla = detail({ id: 4, title: 'NoPlot', propertyType: 'VILLA', bedrooms: 3 });
    const rows = buildCompareRows([bareApartment, noPlotVilla]);
    const byKey = new Map(rows.map((r) => [r.key, r]));

    const plot = byKey.get('plotArea')!;
    expect(plot.cells[0]).toEqual({ status: 'NA', display: 'N/A' });
    expect(plot.cells[1]).toEqual({ status: 'MISSING', display: '—' });

    const bedrooms = byKey.get('bedrooms')!;
    expect(bedrooms.cells[1]).toEqual({ status: 'PRESENT', display: '3 BHK' });
    expect(bedrooms.cells[0]).toEqual({ status: 'MISSING', display: '—' });
  });

  it('handles one property (single column) and mixed types', () => {
    const rows = buildCompareRows([villa]);
    expect(rows.every((r) => r.cells.length === 1)).toBe(true);
    const headers = buildCompareHeaders([apartment, villa]);
    expect(headers.map((h) => h.propertyId)).toEqual([1, 2]);
  });

  it('exposes the documented field set', () => {
    const rows = buildCompareRows([apartment]);
    const labels = rows.map((r) => r.label);
    expect(labels).toContain('Bedrooms');
    expect(labels).toContain('Plot Area');
    expect(labels).toContain('Parking');
    expect(labels).toContain('RERA');
    expect(labels).toContain('Amenities');
  });
});

describe('customer activity analytics', () => {
  it('builds a typed event with a timestamp and no PII', () => {
    const event = buildCustomerActivityEvent('shortlist_add', {
      propertyId: 10,
      activityCount: 2,
      surface: 'property_card',
    });
    expect(event.eventType).toBe('shortlist_add');
    expect(event.propertyId).toBe(10);
    expect(typeof event.timestamp).toBe('string');
    expect(event).not.toHaveProperty('email');
    expect(event).not.toHaveProperty('phone');
  });

  it('defines the documented event name', () => {
    expect(CUSTOMER_ACTIVITY_EVENT_NAME).toBe('sonthillu:customer-activity');
  });
});
