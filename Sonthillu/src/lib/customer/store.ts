import type { CustomerActivityStore } from './types';

/**
 * Dev/test-safe in-memory implementation of CustomerActivityStore.
 * Single-process only; state resets on server restart. The chosen Website DB
 * (a dependency still open from Packet 8) replaces this in production via
 * `setCustomerActivityStore` in `./persistence`. NEVER the CRM database.
 */
export class InMemoryCustomerActivityStore implements CustomerActivityStore {
  private readonly shortlist = new Map<number, number[]>();
  private readonly compare = new Map<number, number[]>();

  async listShortlist(customerId: number): Promise<number[]> {
    return this.shortlist.get(customerId) ?? [];
  }

  async addShortlist(customerId: number, propertyId: number): Promise<void> {
    const current = await this.listShortlist(customerId);
    if (!current.includes(propertyId)) {
      this.shortlist.set(customerId, [propertyId, ...current]);
    }
  }

  async removeShortlist(customerId: number, propertyId: number): Promise<void> {
    const current = await this.listShortlist(customerId);
    this.shortlist.set(
      customerId,
      current.filter((id) => id !== propertyId)
    );
  }

  async hasShortlist(customerId: number, propertyId: number): Promise<boolean> {
    const current = await this.listShortlist(customerId);
    return current.includes(propertyId);
  }

  async listCompare(customerId: number): Promise<number[]> {
    return this.compare.get(customerId) ?? [];
  }

  async setCompare(customerId: number, propertyIds: number[]): Promise<void> {
    this.compare.set(customerId, propertyIds);
  }

  async clearCompare(customerId: number): Promise<void> {
    this.compare.delete(customerId);
  }
}
