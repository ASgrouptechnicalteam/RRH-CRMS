'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BRAND, NAVIGATION } from '@/lib/constants';
import { Button } from '@/components/ui/Button';

const allNavItems = [...NAVIGATION.main];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/97 shadow-nav backdrop-blur-sm border-b border-brand-gold/20'
          : 'bg-white border-b border-cream-dark'
      )}
    >
      <div className="container-page">
        <div className="flex h-16 items-center justify-between md:h-18">
          {/* Logo + Brand Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex-shrink-0">
              <img
                src="/brand/sonthillu-logo.jpeg"
                alt="Sonthillu Constructions"
                className="h-11 w-auto transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span
                className="text-base font-bold text-brand-navy tracking-wide"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                Sonthillu
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-gold">
                Constructions
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            {allNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-sm font-medium text-text-secondary transition-colors hover:text-brand-navy group py-1"
              >
                {item.label}
                {/* Gold underline on hover */}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-gold transition-all duration-200 group-hover:w-full rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-text-secondary hover:text-brand-navy hover:bg-cream"
              >
                Login
              </Button>
            </Link>
            <Link href="/properties">
              <Button
                size="sm"
                className="bg-brand-gold text-brand-navy font-semibold hover:bg-brand-gold-dark hover:text-white shadow-gold border-0 px-5"
              >
                Find Homes
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-brand-navy hover:bg-cream md:hidden transition-colors"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-brand-gold/20 bg-white md:hidden shadow-lg">
          <div className="container-page py-5">
            <nav className="flex flex-col gap-1">
              {allNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-cream hover:text-brand-navy"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
              <Link href="/login" className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-text-secondary hover:text-brand-navy"
                >
                  Login
                </Button>
              </Link>
              <Link href="/properties" className="w-full">
                <Button
                  size="sm"
                  className="w-full bg-brand-gold text-brand-navy font-semibold hover:bg-brand-gold-dark border-0"
                >
                  Find Your Dream Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
