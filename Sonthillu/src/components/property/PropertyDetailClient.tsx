'use client';

import { ImageGallery } from './ImageGallery';
import { PropertyInfo } from './PropertyInfo';
import { PropertyActions } from './PropertyActions';
import { PropertyDetails } from './PropertyDetails';
import { LocationContext } from './LocationContext';
import { ProjectContext } from './ProjectContext';
import { SimilarProperties } from './SimilarProperties';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CallNowButton } from '@/components/leads/CallNowButton';
import type { RecommendationGroup } from '@/lib/recommendations/types';
import type { PublicPropertyDetail, PublicProperty } from '@/types/search';
import { SITE_CONFIG } from '@/lib/constants';

import { useEffect } from 'react';
import { trackClientActivity } from '@/lib/analytics/activity';

interface PropertyDetailClientProps {
  property: PublicPropertyDetail;
  similarProperties: PublicProperty[];
  recommendations?: RecommendationGroup[];
}

export function PropertyDetailClient({
  property,
  similarProperties,
  recommendations,
}: PropertyDetailClientProps) {
  useEffect(() => {
    trackClientActivity({
      eventName: 'property_view',
      propertyId: property.id,
      projectId: property.project?.id,
    });
  }, [property.id, property.project?.id]);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Properties', href: '/properties' },
    { label: property.title },
  ];

  return (
    <div className="bg-white">
      <div className="container-page py-6 lg:py-8">
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-6">
            <ImageGallery images={property.images} title={property.title} />
            <PropertyInfo property={property} />
            <PropertyActions propertyId={property.id} propertyTitle={property.title} />
            <PropertyDetails property={property} />
            <LocationContext property={property} />
            <ProjectContext property={property} />
            <SimilarProperties properties={similarProperties} currentPropertyId={property.id} />
            <RecommendationsSection groups={recommendations ?? []} surface="property_detail" />
          </div>

          <div className="lg:col-span-4">
            <StickyActions property={property} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StickyActions({ property }: { property: PublicPropertyDetail }) {
  // Was `window.location.href` — reads at render time, which under
  // `output: 'export'` also happens once during `next build` (no `window`
  // there) to produce the static HTML, not just in the browser.
  const shareUrl = `${SITE_CONFIG.url}/properties/${property.id}`;
  return (
    <div className="sticky top-24 space-y-4">
      <div className="bg-surface-muted border border-border rounded-xl p-6">
        <h3
          className="text-lg font-semibold text-brand-navy mb-4"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Price Summary
        </h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary">Property Price</dt>
            <dd className="font-semibold text-brand-navy">{property.priceFormatted}</dd>
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <dt>Per sq.ft.</dt>
            <dd>
              {property.areaSqft > 0
                ? `₹${Math.round(property.price / property.areaSqft).toLocaleString('en-IN')}`
                : '—'}
            </dd>
          </div>
          <div className="pt-3 border-t border-border flex justify-between">
            <dt className="font-medium text-text-primary">Total</dt>
            <dd className="font-bold text-brand-navy text-lg">{property.priceFormatted}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-text-muted">
          Additional charges (registration, stamp duty, GST, maintenance deposit) apply as per
          actuals.
        </p>
      </div>

      <div className="bg-brand-navy rounded-xl p-6 text-white">
        <h3
          className="text-lg font-semibold mb-2"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Ready to Visit?
        </h3>
        <p className="text-brand-gold-light text-sm mb-4">
          Schedule a site visit at your convenience.
        </p>
        <CallNowButton
          surface="property_detail"
          propertyId={property.id}
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-brand-gold text-brand-navy font-semibold rounded-lg hover:bg-brand-gold-dark transition-colors"
        >
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
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          Call to Book Visit
        </CallNowButton>
      </div>

      <div className="bg-surface-muted border border-border rounded-xl p-6">
        <h3
          className="text-lg font-semibold text-brand-navy mb-4"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Share This Property
        </h3>
        <div className="flex gap-3">
          <ShareButton
            icon={
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.77,7.46H14.5v-5.28c0-1.42-.79-2.64-2-2.64c-1.09,0-2,1.02-2,2.22v5.28H7.59v5.28h2.55v11.98h4.95V17.74h3.42l0.63-5.28h-4.05v-2.81c0-1.17.55-2.03,1.74-2.03h2.79V7.46z" />
              </svg>
            }
            label="Facebook"
            url={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          />
          <ShareButton
            icon={
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
              </svg>
            }
            label="Twitter"
            url={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(property.title)}`}
          />
          <ShareButton
            icon={
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            }
            label="LinkedIn"
            url={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
          />
          <ShareButton
            icon={
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            }
            label="Email"
            url={`mailto:?subject=${encodeURIComponent(property.title)}&body=${encodeURIComponent(shareUrl)}`}
          />
        </div>
      </div>
    </div>
  );
}

function ShareButton({ icon, label, url }: { icon: React.ReactNode; label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-border transition-colors"
      aria-label={`Share on ${label}`}
    >
      {icon}
    </a>
  );
}
