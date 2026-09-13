'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { HeroSlide } from '@/lib/cms/types';

interface HeroCarouselProps {
  slides: HeroSlide[];
  children?: React.ReactNode;
}

const STATS = [
  { value: '500+', label: 'Happy Families' },
  { value: '10k+', label: 'Properties Sold' },
  { value: '12+', label: 'Locations in Hyderabad' },
  { value: '98%', label: 'Customer Satisfaction' },
];

function HeroFallback({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden min-h-[640px] flex flex-col justify-center bg-brand-navy-dark">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"
          alt="Premium homes"
          className="h-full w-full object-cover opacity-40"
        />
        {/* Layered gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-navy-dark/60 via-brand-navy-dark/50 to-brand-navy-dark" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy-dark/80 via-transparent to-transparent" />
      </div>

      <div className="container-page relative z-10 py-16 md:py-20 flex flex-col items-center justify-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-gold/20 border border-brand-gold/40 text-brand-gold rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Premium Homes in Hyderabad
        </div>

        <h1
          className="text-4xl font-bold text-white leading-tight md:text-5xl lg:text-6xl mb-6 max-w-4xl mx-auto"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Find Your{' '}
          <span className="relative inline-block">
            <span className="text-brand-gold">Dream Home</span>
            {/* Gold underline decoration */}
            <svg
              className="absolute -bottom-2 left-0 w-full"
              height="6"
              viewBox="0 0 200 6"
              preserveAspectRatio="none"
            >
              <path
                d="M0 3 Q50 0 100 3 Q150 6 200 3"
                stroke="#c9a830"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
          Discover handpicked apartments, villas, and independent houses perfect for families — in
          prime Hyderabad locations, with transparent pricing.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link href="/properties">
            <Button className="bg-brand-gold text-brand-navy font-bold hover:bg-brand-gold-dark border-0 px-8 py-3 text-base shadow-gold">
              Explore Homes
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Button>
          </Link>
          <Link href="/projects">
            <Button
              variant="ghost"
              className="border border-white/30 text-white hover:bg-white/10 px-8 py-3 text-base"
            >
              View Projects
            </Button>
          </Link>
        </div>

        {/* Search Widget */}
        <div className="w-full max-w-4xl mx-auto">{children}</div>
      </div>

      {/* Stats bar */}
      <div className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container-page py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-2xl font-bold text-brand-gold"
                  style={{ fontFamily: 'var(--font-family-display)' }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-white/70 font-medium uppercase tracking-wide mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HeroCarousel({ slides, children }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    timerRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, isPaused, nextSlide]);

  if (!slides || slides.length === 0) {
    return <HeroFallback>{children}</HeroFallback>;
  }

  const currentSlide = slides[currentIndex];

  return (
    <section
      className="relative flex min-h-[640px] flex-col justify-center overflow-hidden bg-brand-navy md:min-h-[700px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Highlighted Properties"
    >
      {/* Background Images */}
      {slides.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
            aria-hidden={!isActive}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-brand-navy/65" />
          </div>
        );
      })}

      {/* Content */}
      <div className="container-page relative z-10 mx-auto mt-8 flex flex-col items-center px-4 text-center">
        <div
          className="mb-8 w-full max-w-3xl"
          key={`content-${currentIndex}`}
          style={{ animation: 'fadeInUp 0.7s ease-out forwards' }}
        >
          <h1
            className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            {currentSlide.title}
          </h1>
          <p className="mb-6 text-lg text-white/85 md:text-xl">{currentSlide.subtitle}</p>
          {currentSlide.ctaLabel && currentSlide.ctaUrl && (
            <Link href={currentSlide.ctaUrl}>
              <Button className="bg-brand-gold text-brand-navy font-bold hover:bg-brand-gold-dark border-0 px-8 py-3 shadow-gold">
                {currentSlide.ctaLabel}
              </Button>
            </Link>
          )}
        </div>
        <div className="w-full">{children}</div>
      </div>

      {/* Controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-3 text-white transition hover:bg-brand-gold hover:text-brand-navy focus:outline-none md:left-8"
            aria-label="Previous slide"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-3 text-white transition hover:bg-brand-gold hover:text-brand-navy focus:outline-none md:right-8"
            aria-label="Next slide"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-3">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentIndex}
                className={`h-2.5 rounded-full transition-all ${index === currentIndex ? 'bg-brand-gold w-10' : 'bg-white/40 w-2.5 hover:bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `,
        }}
      />
    </section>
  );
}
