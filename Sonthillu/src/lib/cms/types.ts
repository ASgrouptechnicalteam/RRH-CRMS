export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CMSProvider {
  getHeroSlides(): Promise<HeroSlide[]>;
  getAdminHeroSlides(): Promise<HeroSlide[]>;
  getHeroSlide(id: string): Promise<HeroSlide | null>;
  updateHeroSlide(id: string, updates: Partial<HeroSlide>): Promise<HeroSlide>;
  deleteHeroSlide(id: string): Promise<boolean>;
  createHeroSlide(slide: Omit<HeroSlide, 'id' | 'createdAt' | 'updatedAt'>): Promise<HeroSlide>;
}
