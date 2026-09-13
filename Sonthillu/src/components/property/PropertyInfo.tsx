'use client';

import { useState } from 'react';
import type { PublicPropertyDetail } from '@/types/search';

interface PropertyInfoProps {
  property: PublicPropertyDetail;
}

function getPossessionStatusLabel(status: string | null): {
  label: string;
  variant: 'default' | 'success' | 'warning';
} {
  switch (status) {
    case 'READY_TO_MOVE':
      return { label: 'Ready to Move', variant: 'success' };
    case 'UNDER_CONSTRUCTION':
      return { label: 'Under Construction', variant: 'warning' };
    default:
      return { label: status || 'Not specified', variant: 'default' };
  }
}

function getPropertyTypeLabel(type: string): string {
  switch (type) {
    case 'APARTMENT':
      return 'Apartment';
    case 'VILLA':
      return 'Villa';
    case 'INDEPENDENT_HOUSE':
      return 'Independent House';
    default:
      return type;
  }
}

export function PropertyInfo({ property }: PropertyInfoProps) {
  const possession = getPossessionStatusLabel(property.possessionStatus);

  const specs = [
    { label: 'Property Type', value: getPropertyTypeLabel(property.propertyType) },
    { label: 'Listing Type', value: property.listingType === 'NEW' ? 'New Launch' : 'Resale' },
    ...(property.bedrooms ? [{ label: 'Bedrooms', value: `${property.bedrooms} BHK` }] : []),
    ...(property.bathrooms ? [{ label: 'Bathrooms', value: property.bathrooms.toString() }] : []),
    ...(property.areaSqft ? [{ label: 'Carpet Area', value: property.areaFormatted }] : []),
    ...(property.facing
      ? [
          {
            label: 'Facing',
            value:
              property.facing.charAt(0) +
              property.facing
                .slice(1)
                .toLowerCase()
                .replace('_', ' ')
                .replace(/([A-Z])/g, ' $1'),
          },
        ]
      : []),
    ...(property.possessionStatus ? [{ label: 'Possession', value: possession.label }] : []),
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-brand-gold mb-1">
              {getPropertyTypeLabel(property.propertyType)} ·{' '}
              {property.listingType === 'NEW' ? 'New Launch' : 'Resale'}
            </p>
            <h1
              className="text-3xl md:text-4xl font-bold text-brand-navy leading-tight"
              style={{ fontFamily: 'var(--font-family-display)' }}
            >
              {property.title}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
              <svg
                className="h-4 w-4 text-text-muted flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{property.location}</span>
              {property.address && (
                <>
                  <span className="text-text-muted">·</span>
                  <span>{property.address}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {property.lifecycleStatus === 'SOLD' && (
              <span className="flex-shrink-0 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                Sold Out
              </span>
            )}
            {property.lifecycleStatus === 'RESERVED' && (
              <span className="flex-shrink-0 px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                Reserved
              </span>
            )}
            {possession.variant !== 'default' && (
              <span
                className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium ${
                  possession.variant === 'success'
                    ? 'bg-brand-sage/10 text-brand-sage'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {possession.label}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-4 md:gap-6">
          <p className="text-3xl md:text-4xl font-bold text-brand-navy">
            {property.priceFormatted}
          </p>
        </div>
      </div>

      {specs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-surface-muted rounded-xl border border-border">
          {specs.map((spec, index) => (
            <div key={index} className="flex flex-col">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
                {spec.label}
              </p>
              <p className="text-base font-medium text-text-primary">{spec.value}</p>
            </div>
          ))}
        </div>
      )}

      {property.propertyCode && (
        <p className="text-xs text-text-muted">
          Property ID:{' '}
          <span className="font-mono text-text-secondary">{property.propertyCode}</span>
        </p>
      )}
    </div>
  );
}
