'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useCustomerActivity } from './CustomerActivityProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { EnquiryModal } from '@/components/leads/EnquiryModal';
import { fetchPropertiesForIds } from '@/lib/customer/client-api';
import {
  buildCompareRows,
  buildCompareHeaders,
  NA_DISPLAY,
  MISSING_DISPLAY,
} from '@/lib/customer/compare';
import { buildCustomerActivityEvent, trackCustomerActivityEvent } from '@/lib/customer/activity';
import type { PublicPropertyDetail } from '@/types/search';

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  APARTMENT: 'Apartment',
  VILLA: 'Villa',
  INDEPENDENT_HOUSE: 'Independent House',
};

export function CompareView() {
  const { compare, removeCompare, replaceCompare, clearCompare, shortlist } = useCustomerActivity();
  const [properties, setProperties] = useState<PublicPropertyDetail[]>([]);
  const [unavailableIds, setUnavailableIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [showEnquiry, setShowEnquiry] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (compare.length === 0) {
      setProperties([]);
      setUnavailableIds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPropertiesForIds(compare)
      .then(({ properties: available, unavailableIds: unavailable }) => {
        if (cancelled) return;
        setProperties(available);
        setUnavailableIds(unavailable);
        trackCustomerActivityEvent(
          buildCustomerActivityEvent('compare_view', {
            activityCount: compare.length,
            surface: 'compare_page',
          })
        );
      })
      .catch(() => {
        if (!cancelled) {
          setProperties([]);
          setUnavailableIds(compare);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [compare]);

  const handleClear = useCallback(() => {
    clearCompare();
    setProperties([]);
    setUnavailableIds([]);
  }, [clearCompare]);

  const rows = buildCompareRows(properties);
  const headers = buildCompareHeaders(properties);

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-navy md:text-3xl">
            Compare Properties
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {compare.length} of {compare.length > 0 ? compare.length : 4} selected · up to 4
            properties
          </p>
        </div>
        {compare.length > 0 && (
          <div className="flex gap-2">
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
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear compare
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse rounded-xl bg-border p-10 text-center text-text-muted">
          Loading comparison…
        </div>
      ) : compare.length === 0 ? (
        <EmptyState
          title="Nothing to compare yet"
          description="Add up to 4 properties to compare them side by side, including price, specifications and amenities."
          action={
            <Button variant="primary" size="md">
              <Link href="/properties" className="flex items-center gap-2">
                Browse Properties
              </Link>
            </Button>
          }
        />
      ) : properties.length === 0 && unavailableIds.length > 0 ? (
        <EmptyState
          title="No properties available"
          description="Every compared property is no longer publicly available. You can remove them or replace them from your shortlist."
        />
      ) : (
        <div className="space-y-8">
          {properties.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-md">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-40 border-b border-border bg-surface-muted p-4 text-left align-top">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Property
                      </span>
                    </th>
                    {headers.map((header) => (
                      <th
                        key={header.propertyId}
                        className="w-64 border-b border-l border-border bg-surface-muted p-4 align-top"
                      >
                        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-border">
                          {header.primaryImage ? (
                            <img
                              src={header.primaryImage}
                              alt={header.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <svg
                                className="h-8 w-8 text-text-muted"
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
                          )}
                        </div>
                        <Link
                          href={`/properties/${header.propertyId}`}
                          className="mt-3 block font-semibold text-brand-navy hover:underline"
                        >
                          {header.title}
                        </Link>
                        <p className="mt-1 text-lg font-bold text-brand-navy">
                          {header.priceFormatted}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">{header.location}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant="navy">
                            {PROPERTY_TYPE_LABEL[header.propertyType] ?? header.propertyType}
                          </Badge>
                          {header.listingType === 'RESALE' && <Badge variant="gold">Resale</Badge>}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplaceIndex(compare.indexOf(header.propertyId))}
                            aria-label={`Replace ${header.title}`}
                          >
                            Replace
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCompare(header.propertyId, 'compare_page')}
                            aria-label={`Remove ${header.title} from compare`}
                          >
                            Remove
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-b border-border last:border-b-0">
                      <th className="bg-surface-muted p-4 text-left align-top text-xs font-semibold uppercase tracking-wider text-text-muted">
                        {row.label}
                      </th>
                      {row.cells.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border-l border-border p-4 align-top text-text-primary"
                        >
                          {cell.status === 'PRESENT'
                            ? cell.display
                            : cell.status === 'NA'
                              ? NA_DISPLAY
                              : MISSING_DISPLAY}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {unavailableIds.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-brand-navy">
                No longer available
              </h2>
              <div className="space-y-3">
                {unavailableIds.map((id) => {
                  const index = compare.indexOf(id);
                  return (
                    <div
                      key={id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted p-4"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="h-6 w-6 text-text-muted"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                        <Badge variant="error">No Longer Available</Badge>
                        <p className="text-sm text-text-secondary">
                          This property is no longer listed and is not available for purchase.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {index >= 0 && (
                          <Button variant="ghost" size="sm" onClick={() => setReplaceIndex(index)}>
                            Replace
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCompare(id, 'compare_page')}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <p className="text-xs text-text-muted">
            Fields that do not apply to a property type are shown as &quot;{NA_DISPLAY}&quot;;
            applicable fields missing from the listing are shown as &quot;{MISSING_DISPLAY}&quot;.
          </p>
        </div>
      )}

      {replaceIndex !== null && (
        <ReplaceModal
          targetIndex={replaceIndex}
          shortlistIds={shortlist}
          comparedIds={compare}
          onSelect={(propertyId) => {
            replaceCompare(replaceIndex, propertyId);
            setReplaceIndex(null);
          }}
          onClose={() => setReplaceIndex(null)}
        />
      )}

      {showEnquiry && (
        <EnquiryModal
          mode="multi"
          context={{ propertyIds: properties.map((p) => p.id) }}
          surface="compare_page"
          onClose={() => setShowEnquiry(false)}
        />
      )}
    </div>
  );
}

interface ReplaceModalProps {
  targetIndex: number;
  shortlistIds: number[];
  comparedIds: number[];
  onSelect: (propertyId: number) => void;
  onClose: () => void;
}

function ReplaceModal({
  targetIndex,
  shortlistIds,
  comparedIds,
  onSelect,
  onClose,
}: ReplaceModalProps) {
  const [options, setOptions] = useState<PublicPropertyDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const candidates = shortlistIds.filter((id) => !comparedIds.includes(id));
    if (candidates.length === 0) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPropertiesForIds(candidates)
      .then(({ properties }) => setOptions(properties))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [shortlistIds, comparedIds]);

  return (
    <Modal isOpen onClose={onClose} size="md">
      <ModalHeader onClose={onClose}>Replace compared property</ModalHeader>
      <ModalBody>
        {loading ? (
          <p className="py-6 text-center text-sm text-text-muted">Loading your shortlist…</p>
        ) : options.length === 0 ? (
          <div className="py-6 text-center">
            <p className="mb-4 text-sm text-text-secondary">
              No replacement properties available. Add properties to your shortlist first.
            </p>
            <Button variant="primary" size="sm">
              <Link href="/properties" className="flex items-center gap-2">
                Browse Properties
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {options.map((property) => (
              <li key={property.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">{property.title}</p>
                  <p className="text-xs text-text-muted">
                    {property.priceFormatted} · {property.location}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onSelect(property.id)}>
                  Use this
                </Button>
              </li>
            ))}
          </ul>
        )}
      </ModalBody>
    </Modal>
  );
}
