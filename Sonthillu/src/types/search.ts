/**
 * Sonthillu Property Search Model
 *
 * This model represents the canonical search state for Normal Search.
 * It is designed to be:
 * - URL-serializable (shareable search states)
 * - Extensible for future AI Search integration
 * - Extensible for future Match & Ranking Engine
 * - Safe for browser use (no CRM internals)
 */

export type PropertyType = 'APARTMENT' | 'VILLA' | 'INDEPENDENT_HOUSE';

export type ListingType = 'NEW' | 'RESALE' | 'ANY';

export type SortOption = 'relevance' | 'newest' | 'price_low' | 'price_high';

export type PossessionStatus = 'READY_TO_MOVE' | 'UNDER_CONSTRUCTION' | 'ANY';

/**
 * Core search parameters — the canonical query model.
 * Both Normal Search and future AI Search will produce this structure.
 */
export interface SearchQuery {
  /** Free-text location search (e.g., "Miyapur", "Gachibowli") */
  location?: string;

  /** Property type filter */
  propertyType?: PropertyType;

  /** New / Resale / Any */
  listingType?: ListingType;

  /** Minimum budget in INR (e.g., 4000000 = ₹40 Lakh) */
  minBudget?: number;

  /** Maximum budget in INR (e.g., 6000000 = ₹60 Lakh) */
  maxBudget?: number;

  /** Possession status filter */
  possessionStatus?: PossessionStatus;

  /** Bedrooms/BHK */
  bedrooms?: number;

  /** Sort order */
  sortBy?: SortOption;

  /** Page number (1-indexed) */
  page?: number;

  /** Results per page */
  limit?: number;
}

/**
 * Search result response from the server.
 */
export interface SearchResults {
  properties: PublicProperty[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: SearchQuery;
}

/**
 * Public property model — safe for browser use.
 * This is the DTO returned by the BFF layer.
 */
export interface PublicProperty {
  id: number;
  title: string;
  slug: string;
  propertyType: PropertyType;
  listingType: 'NEW' | 'RESALE';
  price: number;
  priceFormatted: string;
  location: string;
  areaSqft: number;
  areaFormatted: string;
  bedrooms: number | null;
  bathrooms: number | null;
  facing: string | null;
  possessionStatus: string | null;
  lifecycleStatus?: 'LIVE' | 'RESERVED' | 'SOLD' | 'UNPUBLISHED';
  primaryImage: string | null;
  images: PublicPropertyImage[];
  amenities: string[];
  isVerified: boolean;
  createdAt: string;
}

export interface PublicPropertyImage {
  id: number;
  url: string;
  isPrimary: boolean;
  altText: string | null;
  sortOrder: number;
}

export interface PublicProjectReference {
  id: number;
  projectCode: string;
  name: string;
  location: string;
  status: string;
}

export interface PublicProject {
  id: number;
  projectCode: string;
  name: string;
  slug: string | null;
  description: string | null;
  location: string;
  totalArea: string | null;
  launchDate: string | null;
  status: string;
  amenities: string[];
  createdAt: string;
  inventorySummary: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
  };
  primaryImage: string | null;
  images: PublicPropertyImage[];
}

export interface PublicProjectDetail extends PublicProject {
  properties: PublicProperty[];
}

export interface PublicPropertyDetail extends PublicProperty {
  propertyCode: string;
  description: string | null;
  address: string | null;
  amenities: string[];
  possessionStatus: string | null;
  details: Record<string, string | number | boolean> | null;
  seoTitle: string | null;
  seoKeywords: string | null;
  createdAt: string;
  state: string | null;
  city: string | null;
  locality: string | null;
  pincode: string | null;
  listingType: 'NEW' | 'RESALE';
  images: PublicPropertyImage[];
  project: PublicProjectReference | null;
}

/**
 * Search filters configuration for the UI.
 */
export interface SearchFilters {
  location: string;
  propertyType: PropertyType | '';
  listingType: ListingType;
  minBudget: string;
  maxBudget: string;
  possessionStatus: PossessionStatus;
  bedrooms: string;
}

/**
 * Budget preset options for quick selection.
 */
export interface BudgetPreset {
  label: string;
  min?: number;
  max?: number;
}

export const BUDGET_PRESETS: BudgetPreset[] = [
  { label: 'Under ₹50 Lakh', max: 5000000 },
  { label: '₹50 L – ₹75 L', min: 5000000, max: 7500000 },
  { label: '₹75 L – ₹1 Cr', min: 7500000, max: 10000000 },
  { label: '₹1 Cr – ₹1.5 Cr', min: 10000000, max: 15000000 },
  { label: '₹1.5 Cr – ₹2 Cr', min: 15000000, max: 20000000 },
  { label: 'Above ₹2 Cr', min: 20000000 },
] as const;

/**
 * Property type options for the UI.
 */
export const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment / Flat' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'INDEPENDENT_HOUSE', label: 'Independent House' },
];

/**
 * Listing type options for the UI.
 */
export const LISTING_TYPE_OPTIONS: { value: ListingType; label: string }[] = [
  { value: 'ANY', label: 'Any' },
  { value: 'NEW', label: 'New' },
  { value: 'RESALE', label: 'Resale' },
];

/**
 * Sort options for the UI.
 */
export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

/**
 * Default search query values.
 */
export const DEFAULT_SEARCH_QUERY: SearchQuery = {
  sortBy: 'relevance',
  page: 1,
  limit: 12,
};

/**
 * Default filter values.
 */
export const DEFAULT_FILTERS: SearchFilters = {
  location: '',
  propertyType: '',
  listingType: 'ANY',
  minBudget: '',
  maxBudget: '',
  possessionStatus: 'ANY',
  bedrooms: '',
};
