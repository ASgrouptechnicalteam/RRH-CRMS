'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PublicPropertyImage } from '@/types/search';

interface ImageGalleryProps {
  images: PublicPropertyImage[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const primaryImage = images.find((img) => img.isPrimary);
  const displayImages = primaryImage
    ? [primaryImage, ...images.filter((img) => !img.isPrimary)]
    : images;

  const currentImage = displayImages[selectedIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    },
    [displayImages.length, isFullscreen]
  );

  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen, handleKeyDown]);

  if (!currentImage || displayImages.length === 0) {
    return (
      <div className="aspect-[4/3] bg-border flex items-center justify-center rounded-xl">
        <svg
          className="h-16 w-16 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      </div>
    );
  }

  const goToIndex = (index: number) => {
    setSelectedIndex(index);
  };

  const goPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const goNext = () => {
    setSelectedIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div ref={galleryRef} className="space-y-4">
      <button
        onClick={() => setIsFullscreen(true)}
        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-border w-full focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2"
        aria-label={`View ${title} gallery in fullscreen`}
      >
        <img
          src={currentImage.url}
          alt={currentImage.altText || `${title} - Image ${selectedIndex + 1}`}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
        />
        {displayImages.length > 1 && (
          <>
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
              role="tablist"
              aria-label="Image indicators"
            >
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToIndex(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === selectedIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
                  }`}
                  role="tab"
                  aria-selected={index === selectedIndex}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-brand-navy shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
              aria-label="Previous image"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-brand-navy shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
              aria-label="Next image"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <div className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white text-brand-navy shadow-lg transition-colors">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </div>
          </>
        )}
      </button>

      {displayImages.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          role="tablist"
          aria-label="Thumbnail navigation"
        >
          {displayImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToIndex(index)}
              className={`relative flex-shrink-0 h-20 w-28 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-brand-gold'
                  : 'border-transparent hover:border-brand-gold/50'
              }`}
              role="tab"
              aria-selected={index === selectedIndex}
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={image.url}
                alt={image.altText || `${title} - Image ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {image.isPrimary && (
                <span className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 bg-brand-gold text-white rounded">
                  Primary
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} - Image ${selectedIndex + 1} of ${displayImages.length}`}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
            aria-label="Close fullscreen"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <button
            onClick={goPrevious}
            className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold hidden md:block"
            aria-label="Previous image"
          >
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={currentImage.url}
              alt={currentImage.altText || `${title} - Image ${selectedIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
          <button
            onClick={goNext}
            className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold hidden md:block"
            aria-label="Next image"
          >
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
