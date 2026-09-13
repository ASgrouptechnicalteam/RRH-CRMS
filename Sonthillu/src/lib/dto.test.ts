import { describe, it, expect } from 'vitest';
import { toPublicPropertyDetail } from './dto';

describe('DTO Security (Phase 3)', () => {
  it('should sanitize property.details and drop malicious/nested/internal JSON', () => {
    // Malicious/Rich CRM payload
    const mockCrmProperty: any = {
      property_code: 'TEST-01',
      title: 'Test Prop',
      description: 'Desc',
      status: 'LIVE',
      brand_type: 'SONTHILLU',
      category: 'VILLA',
      price: 10000,
      area_sqft: 1000,
      location: 'Hyderabad',
      created_by_id: 1,
      company_id: 1,
      // Malicious details payload
      details: {
        bedrooms: 3,
        parking: 2,
        furnishing: 'Semi-Furnished',

        internal_note: 'SECRET',
        seller_phone: '9999999999',
        appraisal_value: 12000000,

        nested_internal: {
          secret: 'DO NOT EXPOSE',
        },

        internal_array: ['secret'],
      },
    };

    const result = toPublicPropertyDetail(mockCrmProperty);

    // Verify approved primitive fields remain
    expect(result.details).not.toBeNull();
    expect(result.details?.parking).toBe(2);
    expect(result.details?.furnishing).toBe('Semi-Furnished');

    // Explicitly verify forbidden data is absent
    expect((result.details as any)?.internal_note).toBeUndefined();
    expect((result.details as any)?.seller_phone).toBeUndefined();
    expect((result.details as any)?.appraisal_value).toBeUndefined();
    expect((result.details as any)?.nested_internal).toBeUndefined();
    expect((result.details as any)?.internal_array).toBeUndefined();

    // Verify the unapproved 'bedrooms' inside details is stripped
    expect((result.details as any)?.bedrooms).toBeUndefined();
  });

  it('should handle null details safely', () => {
    const mockCrmProperty: any = {
      property_code: 'TEST-02',
      category: 'VILLA',
      price: 10000,
      area_sqft: 1000,
      details: null,
    };

    const result = toPublicPropertyDetail(mockCrmProperty);
    expect(result.details).toBeNull();
  });

  it('should handle non-object details safely', () => {
    const mockCrmProperty: any = {
      property_code: 'TEST-03',
      category: 'VILLA',
      price: 10000,
      area_sqft: 1000,
      details: 'string data',
    };

    const result = toPublicPropertyDetail(mockCrmProperty);
    expect(result.details).toBeNull();
  });

  it('should handle array details safely', () => {
    const mockCrmProperty: any = {
      property_code: 'TEST-04',
      category: 'VILLA',
      price: 10000,
      area_sqft: 1000,
      details: ['secret', 'data'],
    };

    const result = toPublicPropertyDetail(mockCrmProperty);
    expect(result.details).toBeNull();
  });
});

import { queryToSearchParams, searchParamsToQuery, filtersToQuery, queryToFilters } from './dto';

describe('Search URL Serialization (Phase 17.2)', () => {
  it('should preserve bedrooms and budget round-trip', () => {
    const query = {
      location: 'Miyapur',
      bedrooms: 3,
      minBudget: 5000000,
      maxBudget: 15000000,
      propertyType: 'VILLA' as const,
    };

    const params = queryToSearchParams(query);
    expect(params.get('bedrooms')).toBe('3');

    const restored = searchParamsToQuery(params);
    expect(restored.bedrooms).toBe(3);
    expect(restored.minBudget).toBe(5000000);
    expect(restored.propertyType).toBe('VILLA');
  });

  it('should parse form filters into query correctly', () => {
    const filters = {
      location: '  Gachibowli  ',
      bedrooms: '2',
      minBudget: '50L',
      maxBudget: '1.5Cr',
      propertyType: 'APARTMENT' as const,
      listingType: 'ANY' as const,
      possessionStatus: 'ANY' as const,
    };

    const query = filtersToQuery(filters);
    expect(query.location).toBe('Gachibowli');
    expect(query.bedrooms).toBe(2);
    expect(query.minBudget).toBe(5000000);
    expect(query.maxBudget).toBe(15000000);
  });
});
