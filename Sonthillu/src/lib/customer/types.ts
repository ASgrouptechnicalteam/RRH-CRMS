export const GUEST_SHORTLIST_KEY = 'sonthillu:guest:shortlist';
export const GUEST_COMPARE_KEY = 'sonthillu:guest:compare';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Persistence boundary for customer shortlist/compare activity.
 * The chosen Website DB/ORM (a dependency still open from Packet 8) will
 * implement this interface; the dev-safe in-memory store is the default.
 */
export interface CustomerActivityStore {
  listShortlist(customerId: number): Promise<number[]>;
  addShortlist(customerId: number, propertyId: number): Promise<void>;
  removeShortlist(customerId: number, propertyId: number): Promise<void>;
  hasShortlist(customerId: number, propertyId: number): Promise<boolean>;

  listCompare(customerId: number): Promise<number[]>;
  setCompare(customerId: number, propertyIds: number[]): Promise<void>;
  clearCompare(customerId: number): Promise<void>;
}

export function isValidPropertyId(id: unknown): id is number {
  const n = Number(id);
  return Number.isInteger(n) && n > 0;
}

export function assertValidPropertyId(id: unknown): asserts id is number {
  if (!isValidPropertyId(id)) {
    throw new RangeError(`Invalid property id: ${String(id)}`);
  }
}
