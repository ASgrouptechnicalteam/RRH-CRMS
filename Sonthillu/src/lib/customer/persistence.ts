import { PrismaCustomerActivityStore } from './prisma-store';
import type { CustomerActivityStore } from './types';

/**
 * Module-level store seam for server-side customer activity (shortlist/compare).
 *
 * Backed by Sonthillu Web DB via Prisma.
 */
let store: CustomerActivityStore = new PrismaCustomerActivityStore();

export function setCustomerActivityStore(next: CustomerActivityStore): void {
  store = next;
}

export function getCustomerActivityStore(): CustomerActivityStore {
  return store;
}
