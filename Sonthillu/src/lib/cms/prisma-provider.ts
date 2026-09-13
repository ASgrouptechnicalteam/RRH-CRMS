/**
 * Prisma-backed CMS Provider (P8)
 *
 * Replaces LocalCMSProvider for production.
 * All hero slide data persists in the MySQL database via the HeroSlide model.
 *
 * This provider is NEVER called directly from React components.
 * All calls go through Server Actions or Server Components.
 */
import { prisma } from '../db/client';
import type { CMSProvider, HeroSlide } from './types';

function mapSlide(db: any): HeroSlide {
  return {
    id: db.id,
    image: db.imageUrl, // Map DB field to legacy HeroSlide.image
    title: db.title,
    subtitle: db.subtitle,
    ctaLabel: db.ctaLabel,
    ctaUrl: db.ctaUrl,
    displayOrder: db.displayOrder,
    active: db.active,
    createdAt: db.createdAt.toISOString(),
    updatedAt: db.updatedAt.toISOString(),
  };
}

export class PrismaCMSProvider implements CMSProvider {
  /** Returns only active slides, sorted by displayOrder. */
  async getHeroSlides(): Promise<HeroSlide[]> {
    const rows = await prisma.heroSlide.findMany({
      where: { active: true },
      orderBy: { displayOrder: 'asc' },
    });
    return rows.map(mapSlide);
  }

  /** Returns ALL slides (active + inactive) for admin CMS. */
  async getAdminHeroSlides(): Promise<HeroSlide[]> {
    const rows = await prisma.heroSlide.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return rows.map(mapSlide);
  }

  async getHeroSlide(id: string): Promise<HeroSlide | null> {
    const row = await prisma.heroSlide.findUnique({ where: { id } });
    return row ? mapSlide(row) : null;
  }

  async createHeroSlide(
    slide: Omit<HeroSlide, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<HeroSlide> {
    const row = await prisma.heroSlide.create({
      data: {
        imageUrl: slide.image,
        title: slide.title,
        subtitle: slide.subtitle,
        ctaLabel: slide.ctaLabel,
        ctaUrl: slide.ctaUrl,
        displayOrder: slide.displayOrder,
        active: slide.active,
      },
    });
    return mapSlide(row);
  }

  async updateHeroSlide(id: string, updates: Partial<HeroSlide>): Promise<HeroSlide> {
    const row = await prisma.heroSlide.update({
      where: { id },
      data: {
        ...(updates.image !== undefined ? { imageUrl: updates.image } : {}),
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.subtitle !== undefined ? { subtitle: updates.subtitle } : {}),
        ...(updates.ctaLabel !== undefined ? { ctaLabel: updates.ctaLabel } : {}),
        ...(updates.ctaUrl !== undefined ? { ctaUrl: updates.ctaUrl } : {}),
        ...(updates.displayOrder !== undefined ? { displayOrder: updates.displayOrder } : {}),
        ...(updates.active !== undefined ? { active: updates.active } : {}),
      },
    });
    return mapSlide(row);
  }

  async deleteHeroSlide(id: string): Promise<boolean> {
    try {
      await prisma.heroSlide.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
