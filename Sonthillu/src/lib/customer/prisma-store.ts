import { prisma } from '@/lib/db/client';
import type { CustomerActivityStore } from './types';

export class PrismaCustomerActivityStore implements CustomerActivityStore {
  async listShortlist(customerId: number): Promise<number[]> {
    const items = await prisma.shortlistItem.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: { propertyId: true },
    });
    return items.map((i) => i.propertyId);
  }

  async addShortlist(customerId: number, propertyId: number): Promise<void> {
    try {
      await prisma.shortlistItem.upsert({
        where: { customerId_propertyId: { customerId, propertyId } },
        update: {},
        create: { customerId, propertyId },
      });
    } catch (e) {
      // Ignore if it's a constraint issue (already exists)
    }
  }

  async removeShortlist(customerId: number, propertyId: number): Promise<void> {
    await prisma.shortlistItem.deleteMany({
      where: { customerId, propertyId },
    });
  }

  async hasShortlist(customerId: number, propertyId: number): Promise<boolean> {
    const count = await prisma.shortlistItem.count({
      where: { customerId, propertyId },
    });
    return count > 0;
  }

  async listCompare(customerId: number): Promise<number[]> {
    const items = await prisma.compareItem.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
      select: { propertyId: true },
    });
    return items.map((i) => i.propertyId);
  }

  async setCompare(customerId: number, propertyIds: number[]): Promise<void> {
    // Transaction to replace compare items
    await prisma.$transaction(async (tx) => {
      await tx.compareItem.deleteMany({
        where: { customerId },
      });

      if (propertyIds.length > 0) {
        await tx.compareItem.createMany({
          data: propertyIds.map((propertyId) => ({
            customerId,
            propertyId,
          })),
        });
      }
    });
  }

  async clearCompare(customerId: number): Promise<void> {
    await prisma.compareItem.deleteMany({
      where: { customerId },
    });
  }
}
