import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../db/client';
import { PrismaCMSProvider } from './prisma-provider';

describe('PrismaCMSProvider', () => {
  const provider = new PrismaCMSProvider();

  beforeEach(async () => {
    await prisma.heroSlide.deleteMany();
  });

  it('creates and retrieves active slides in correct order', async () => {
    const slide1 = await provider.createHeroSlide({
      title: 'Slide 1',
      subtitle: 'Sub 1',
      ctaLabel: 'Click',
      ctaUrl: '/1',
      image: 'img1.jpg',
      displayOrder: 2,
      active: true,
    });

    const slide2 = await provider.createHeroSlide({
      title: 'Slide 2',
      subtitle: 'Sub 2',
      ctaLabel: 'Click',
      ctaUrl: '/2',
      image: 'img2.jpg',
      displayOrder: 1,
      active: true,
    });

    const slide3 = await provider.createHeroSlide({
      title: 'Inactive Slide',
      subtitle: 'Sub 3',
      ctaLabel: 'Click',
      ctaUrl: '/3',
      image: 'img3.jpg',
      displayOrder: 0,
      active: false,
    });

    // getHeroSlides() returns ONLY active slides, sorted by displayOrder
    const publicSlides = await provider.getHeroSlides();
    expect(publicSlides).toHaveLength(2);
    expect(publicSlides[0].id).toBe(slide2.id); // order 1
    expect(publicSlides[1].id).toBe(slide1.id); // order 2

    // getAdminHeroSlides() returns ALL slides, sorted by displayOrder
    const adminSlides = await provider.getAdminHeroSlides();
    expect(adminSlides).toHaveLength(3);
    expect(adminSlides[0].id).toBe(slide3.id); // order 0
  });

  it('updates a slide', async () => {
    const slide = await provider.createHeroSlide({
      title: 'Old Title',
      subtitle: 'Sub 1',
      ctaLabel: 'Click',
      ctaUrl: '/1',
      image: 'img1.jpg',
      displayOrder: 2,
      active: true,
    });

    const updated = await provider.updateHeroSlide(slide.id, { title: 'New Title' });
    expect(updated.title).toBe('New Title');

    const fetched = await provider.getHeroSlide(slide.id);
    expect(fetched?.title).toBe('New Title');
  });

  it('deletes a slide', async () => {
    const slide = await provider.createHeroSlide({
      title: 'Delete Me',
      subtitle: 'Sub 1',
      ctaLabel: 'Click',
      ctaUrl: '/1',
      image: 'img1.jpg',
      displayOrder: 2,
      active: true,
    });

    await provider.deleteHeroSlide(slide.id);

    const fetched = await provider.getHeroSlide(slide.id);
    expect(fetched).toBeNull();
  });
});
