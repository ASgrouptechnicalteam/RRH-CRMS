'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCustomerActivity } from './CustomerActivityProvider';
import { PropertyCard } from '@/components/search/PropertyCard';
import { UnavailablePropertyCard } from './UnavailablePropertyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { EnquiryModal } from '@/components/leads/EnquiryModal';
import { fetchPropertiesForIds } from '@/lib/customer/client-api';
import type { PublicPropertyDetail } from '@/types/search';

export function ShortlistView() {
  const { shortlist, removeFromShortlist } = useCustomerActivity();
  const [properties, setProperties] = useState<PublicPropertyDetail[]>([]);
  const [unavailableIds, setUnavailableIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnquiry, setShowEnquiry] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (shortlist.length === 0) {
      setProperties([]);
      setUnavailableIds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPropertiesForIds(shortlist)
      .then(({ properties: available, unavailableIds: unavailable }) => {
        if (cancelled) return;
        setProperties(available);
        setUnavailableIds(unavailable);
      })
      .catch(() => {
        if (!cancelled) {
          setProperties([]);
          setUnavailableIds(shortlist);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shortlist]);

  const total = properties.length + unavailableIds.length;

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-navy md:text-3xl">
            My Shortlist
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {total} {total === 1 ? 'property' : 'properties'} saved
          </p>
        </div>
        {properties.length > 0 && (
          <Button variant="gold" size="md" onClick={() => setShowEnquiry(true)}>
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Enquire About Selected
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-border shadow-md">
              <div className="aspect-[4/3] bg-border/70" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-1/3 rounded bg-border" />
                <div className="h-4 w-3/4 rounded bg-border" />
                <div className="h-4 w-1/2 rounded bg-border" />
              </div>
            </div>
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState
          title="Your shortlist is empty"
          description="Save properties you like by tapping the heart icon on any property card. Your shortlist is kept on this device until you sign in."
          action={
            <Button variant="primary" size="md">
              <Link href="/properties" className="flex items-center gap-2">
                Browse Properties
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <div key={property.id} className="relative">
              <PropertyCard property={property} />
              <button
                type="button"
                onClick={() => removeFromShortlist(property.id, 'shortlist_page')}
                aria-label={`Remove ${property.title} from shortlist`}
                className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-text-primary shadow-sm transition-colors hover:bg-white hover:text-error"
              >
                <svg
                  className="h-4 w-4"
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
            </div>
          ))}
          {unavailableIds.map((id) => (
            <UnavailablePropertyCard key={id} propertyId={id} />
          ))}
        </div>
      )}

      {showEnquiry && (
        <EnquiryModal
          mode="multi"
          context={{ propertyIds: properties.map((p) => p.id) }}
          surface="shortlist_page"
          onClose={() => setShowEnquiry(false)}
        />
      )}
    </div>
  );
}
