import type { HeroSlide, CMSProvider } from './types';
import { PrismaCMSProvider } from './prisma-provider';

// In-memory mock data for test environments only.
// NOT used in production. Replaced by PrismaCMSProvider.
let MOCK_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000',
    title: 'Find Your Dream Home',
    subtitle: 'Discover premium properties in top locations',
    ctaLabel: 'Browse Properties',
    ctaUrl: '/properties',
    displayOrder: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'slide-2',
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=2000',
    title: 'Upcoming Luxury Projects',
    subtitle: 'Be the first to explore our exclusive new launches',
    ctaLabel: 'Explore Projects',
    ctaUrl: '/projects',
    displayOrder: 2,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'slide-3',
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000',
    title: 'Sell With Sonthillu',
    subtitle: 'Get the best value for your property with our expert appraisal',
    ctaLabel: 'List Your Property',
    ctaUrl: '/sell-property',
    displayOrder: 3,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * LOCAL/TEST CMS Provider (in-memory).
 * Used only in test environments where Prisma is not available.
 * All data is lost on server restart.
 */
class LocalCMSProvider implements CMSProvider {
  async getHeroSlides(): Promise<HeroSlide[]> {
    return MOCK_SLIDES.filter((s) => s.active).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getAdminHeroSlides(): Promise<HeroSlide[]> {
    return [...MOCK_SLIDES].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getHeroSlide(id: string): Promise<HeroSlide | null> {
    return MOCK_SLIDES.find((s) => s.id === id) ?? null;
  }

  async updateHeroSlide(id: string, updates: Partial<HeroSlide>): Promise<HeroSlide> {
    const i = MOCK_SLIDES.findIndex((s) => s.id === id);
    if (i === -1) throw new Error('Slide not found');
    MOCK_SLIDES[i] = { ...MOCK_SLIDES[i], ...updates, updatedAt: new Date().toISOString() };
    return MOCK_SLIDES[i];
  }

  async deleteHeroSlide(id: string): Promise<boolean> {
    const before = MOCK_SLIDES.length;
    MOCK_SLIDES = MOCK_SLIDES.filter((s) => s.id !== id);
    return MOCK_SLIDES.length < before;
  }

  async createHeroSlide(
    slide: Omit<HeroSlide, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<HeroSlide> {
    const newSlide: HeroSlide = {
      ...slide,
      id: `slide-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_SLIDES.push(newSlide);
    return newSlide;
  }
}

/**
 * Active CMS provider.
 *
 * In production (NODE_ENV=production or DATABASE_URL set), uses PrismaCMSProvider.
 * In test environments (NODE_ENV=test), uses LocalCMSProvider to avoid Prisma dependency.
 * In development without DATABASE_URL, falls back to LocalCMSProvider with a warning.
 */
function buildCMSProvider(): CMSProvider {
  if (process.env.NODE_ENV === 'test') {
    return new LocalCMSProvider();
  }
  if (process.env.DATABASE_URL) {
    return new PrismaCMSProvider();
  }
  // Development without DB: warn and use local mock
  console.warn(
    '[CMS] DATABASE_URL not set. Using local in-memory CMS provider. ' +
      'Hero slide changes will NOT persist across restarts.'
  );
  return new LocalCMSProvider();
}

export const cms: CMSProvider = buildCMSProvider();
