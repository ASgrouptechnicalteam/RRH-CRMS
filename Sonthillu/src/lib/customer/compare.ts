import type { PossessionStatus, PropertyType, PublicPropertyDetail } from '../../types/search';

export const NA_DISPLAY = 'N/A';
export const MISSING_DISPLAY = '—';

export type CompareCellStatus = 'PRESENT' | 'NA' | 'MISSING';

export interface CompareCell {
  status: CompareCellStatus;
  display: string;
}

export interface CompareRow {
  key: string;
  label: string;
  cells: CompareCell[];
}

export interface CompareHeader {
  propertyId: number;
  slug: string;
  title: string;
  priceFormatted: string;
  location: string;
  propertyType: PropertyType;
  listingType: 'NEW' | 'RESALE';
  primaryImage: string | null;
  isVerified: boolean;
}

function cellPresent(display: string): CompareCell {
  return { status: 'PRESENT', display };
}

function cellNA(): CompareCell {
  return { status: 'NA', display: NA_DISPLAY };
}

function cellMissing(): CompareCell {
  return { status: 'MISSING', display: MISSING_DISPLAY };
}

function readDetail(property: PublicPropertyDetail, keys: string[]): unknown {
  const details = property.details;
  if (!details || typeof details !== 'object') return undefined;
  const record = details as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function presenceDisplay(value: unknown): string | null {
  if (typeof value === 'boolean') return value ? 'Available' : 'Not available';
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (['yes', 'available', 'true'].includes(lower)) return 'Available';
    if (['no', 'not available', 'false'].includes(lower)) return 'Not available';
    return value;
  }
  if (typeof value === 'number') return value > 0 ? String(value) : 'Not available';
  return null;
}

function facingLabel(facing: string): string {
  return facing
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function possessionLabel(status: PossessionStatus | string | null): string {
  if (status === 'READY_TO_MOVE') return 'Ready to Move';
  if (status === 'UNDER_CONSTRUCTION') return 'Under Construction';
  return status ?? '';
}

interface FieldSpec {
  key: string;
  label: string;
  applicable: (type: PropertyType) => boolean;
  value: (property: PublicPropertyDetail) => CompareCell;
}

/**
 * Property-type-aware comparison fields. A field that is not applicable to a
 * property type renders as "N/A"; a field that IS applicable but absent from
 * the source data renders as "—" (missing). Both are preserved distinctly.
 */
const FIELD_SPECS: FieldSpec[] = [
  {
    key: 'bedrooms',
    label: 'Bedrooms',
    applicable: () => true,
    value: (p) => (p.bedrooms != null ? cellPresent(`${p.bedrooms} BHK`) : cellMissing()),
  },
  {
    key: 'bathrooms',
    label: 'Bathrooms',
    applicable: () => true,
    value: (p) => (p.bathrooms != null ? cellPresent(String(p.bathrooms)) : cellMissing()),
  },
  {
    key: 'builtUpArea',
    label: 'Built-up Area',
    applicable: () => true,
    value: (p) => (p.areaSqft > 0 ? cellPresent(p.areaFormatted) : cellMissing()),
  },
  {
    key: 'plotArea',
    label: 'Plot Area',
    applicable: (type) => type === 'VILLA' || type === 'INDEPENDENT_HOUSE',
    value: (p) => {
      const value = readDetail(p, ['plot_area', 'plotArea', 'land_area']);
      if (value === undefined) return cellMissing();
      const text = String(value);
      return cellPresent(
        /sq|yards|acres/i.test(text) ? text : `${Number(value).toLocaleString('en-IN')} sq.ft`
      );
    },
  },
  {
    key: 'floor',
    label: 'Floor',
    applicable: (type) => type === 'APARTMENT',
    value: (p) => {
      const value = readDetail(p, ['floor', 'floor_no']);
      return value === undefined ? cellMissing() : cellPresent(String(value));
    },
  },
  {
    key: 'parking',
    label: 'Parking',
    applicable: (type) => type === 'VILLA' || type === 'INDEPENDENT_HOUSE',
    value: (p) => {
      const inAmenities = (p.amenities ?? []).some((amenity) => /park/i.test(amenity));
      if (inAmenities) return cellPresent('Available');
      const display = presenceDisplay(readDetail(p, ['parking', 'parking_slots', 'car_parking']));
      return display ? cellPresent(display) : cellMissing();
    },
  },
  {
    key: 'facing',
    label: 'Facing',
    applicable: () => true,
    value: (p) => (p.facing ? cellPresent(facingLabel(p.facing)) : cellMissing()),
  },
  {
    key: 'possession',
    label: 'Possession',
    applicable: () => true,
    value: (p) => {
      const label = possessionLabel(p.possessionStatus);
      return label ? cellPresent(label) : cellMissing();
    },
  },
  {
    key: 'rera',
    label: 'RERA',
    applicable: () => true,
    value: (p) => {
      const value = readDetail(p, ['rera', 'rera_status', 'rera_number']);
      return value === undefined ? cellMissing() : cellPresent(String(value));
    },
  },
  {
    key: 'amenities',
    label: 'Amenities',
    applicable: () => true,
    value: (p) => {
      const amenities = p.amenities ?? [];
      return amenities.length > 0 ? cellPresent(amenities.slice(0, 6).join(', ')) : cellMissing();
    },
  },
];

export const COMPARE_FIELD_COUNT = FIELD_SPECS.length;

export function buildCompareHeaders(properties: PublicPropertyDetail[]): CompareHeader[] {
  return properties.map((p) => ({
    propertyId: p.id,
    slug: p.slug,
    title: p.title,
    priceFormatted: p.priceFormatted,
    location: p.location,
    propertyType: p.propertyType,
    listingType: p.listingType,
    primaryImage: p.primaryImage,
    isVerified: p.isVerified,
  }));
}

export function buildCompareRows(properties: PublicPropertyDetail[]): CompareRow[] {
  return FIELD_SPECS.map((field) => ({
    key: field.key,
    label: field.label,
    cells: properties.map((p) => (field.applicable(p.propertyType) ? field.value(p) : cellNA())),
  }));
}
