import { describe, it, expect, beforeEach } from 'vitest';
import { cms } from './hero';

describe('CMS Hero Provider (Phase 17.3)', () => {
  it('should return only active slides ordered by displayOrder', async () => {
    const slides = await cms.getHeroSlides();
    expect(slides.length).toBeGreaterThan(0);

    // Check ordering
    let prevOrder = -1;
    for (const slide of slides) {
      expect(slide.active).toBe(true);
      expect(slide.displayOrder).toBeGreaterThanOrEqual(prevOrder);
      prevOrder = slide.displayOrder;
    }
  });

  it('should allow admin to get all slides including inactive', async () => {
    // Add an inactive slide temporarily
    const created = await cms.createHeroSlide({
      image: 'test',
      title: 'test',
      subtitle: 'test',
      ctaLabel: 'test',
      ctaUrl: 'test',
      displayOrder: 99,
      active: false,
    });

    const publicSlides = await cms.getHeroSlides();
    const adminSlides = await (cms as any).getAdminHeroSlides();

    expect(adminSlides.length).toBeGreaterThan(publicSlides.length);
    expect(publicSlides.find((s) => s.id === created.id)).toBeUndefined();
    expect(adminSlides.find((s: any) => s.id === created.id)).toBeDefined();

    // Clean up
    await cms.deleteHeroSlide(created.id);
  });

  it('should update slide status correctly', async () => {
    const slides = await cms.getHeroSlides();
    const slideToUpdate = slides[0];

    const updated = await cms.updateHeroSlide(slideToUpdate.id, { active: false });
    expect(updated.active).toBe(false);

    const publicSlidesAfter = await cms.getHeroSlides();
    expect(publicSlidesAfter.find((s) => s.id === slideToUpdate.id)).toBeUndefined();

    // Restore
    await cms.updateHeroSlide(slideToUpdate.id, { active: true });
  });
});
