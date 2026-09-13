import type { Property, PropertyImage, ProjectReference } from '@/types/property';
import type { Project } from '@/types/project';
import type {
  PublicProperty,
  PublicPropertyImage,
  PublicPropertyDetail,
  PublicProject,
  PublicProjectDetail,
  PublicProjectReference,
  SearchQuery,
  SearchFilters,
  PropertyType,
} from '@/types/search';

/**
 * Transform CRM Property to PublicProperty DTO.
 * Excludes: seller data, internal notes, exact coordinates, workflow state.
 */
export function toPublicProperty(property: Property): PublicProperty {
  const primaryImage = property.images?.find((img) => img.is_primary);
  const allImages = property.images || [];

  return {
    id: property.id,
    title: property.title,
    slug: property.property_code,
    propertyType: mapCategoryToPropertyType(property.category),
    listingType: 'NEW', // Default; CRM doesn't distinguish yet
    price: property.price,
    priceFormatted: formatPrice(property.price),
    location: property.location,
    areaSqft: property.area_sqft,
    areaFormatted: formatArea(property.area_sqft),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    facing: property.facing,
    possessionStatus: property.possession_status,
    lifecycleStatus:
      (property.lifecycle_status as 'LIVE' | 'RESERVED' | 'SOLD' | 'UNPUBLISHED') || undefined,
    primaryImage: primaryImage?.image_url || null,
    images: allImages.map(toPublicPropertyImage),
    amenities: parseAmenities(property.amenities),
    isVerified: false, // Default; CRM doesn't provide this yet
    createdAt: property.created_at,
  };
}

/**
 * Transform CRM PropertyImage to PublicPropertyImage.
 */
export function toPublicPropertyImage(image: PropertyImage): PublicPropertyImage {
  return {
    id: image.id,
    url: image.image_url,
    isPrimary: image.is_primary,
    altText: image.alt_text,
    sortOrder: image.sort_order,
  };
}

/**
 * Transform CRM Property array to PublicProperty array.
 */
export function toPublicPropertyList(properties: Property[]): PublicProperty[] {
  return properties.map(toPublicProperty);
}

/**
 * Map CRM category string to PropertyType.
 * CRM categories may vary; map known ones to our enum.
 */
function mapCategoryToPropertyType(category: string): PropertyType {
  const normalized = category.toUpperCase().replace(/[\s-]/g, '_');

  if (normalized.includes('APARTMENT') || normalized.includes('FLAT')) {
    return 'APARTMENT';
  }
  if (normalized.includes('VILLA')) {
    return 'VILLA';
  }
  if (normalized.includes('INDEPENDENT') || normalized.includes('HOUSE')) {
    return 'INDEPENDENT_HOUSE';
  }

  // Default to APARTMENT for unknown categories
  return 'APARTMENT';
}

/**
 * Parse amenities from CRM format (JSON string or comma-separated).
 */
function parseAmenities(amenities: string | null): string[] {
  if (!amenities) return [];
  try {
    const parsed = JSON.parse(amenities);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return amenities
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
  }
}

/**
 * Format price in Indian currency format.
 */
export function formatPrice(price: number): string {
  if (price >= 10000000) {
    const cr = price / 10000000;
    return cr % 1 === 0 ? `₹${cr} Cr` : `₹${cr.toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    const l = price / 100000;
    return l % 1 === 0 ? `₹${l} L` : `₹${l.toFixed(2)} L`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
}

/**
 * Format area in sq.ft.
 */
export function formatArea(area: number): string {
  return `${area.toLocaleString('en-IN')} sq.ft.`;
}

/**
 * Convert SearchFilters to SearchQuery.
 */
export function filtersToQuery(filters: SearchFilters): SearchQuery {
  const query: SearchQuery = {};

  if (filters.location.trim()) {
    query.location = filters.location.trim();
  }
  if (filters.propertyType) {
    query.propertyType = filters.propertyType as PropertyType;
  }
  if (filters.listingType && filters.listingType !== 'ANY') {
    query.listingType = filters.listingType;
  }
  if (filters.minBudget) {
    query.minBudget = parseBudgetInput(filters.minBudget);
  }
  if (filters.maxBudget) {
    query.maxBudget = parseBudgetInput(filters.maxBudget);
  }
  if (filters.possessionStatus && filters.possessionStatus !== 'ANY') {
    query.possessionStatus = filters.possessionStatus;
  }
  if (filters.bedrooms) {
    const parsed = parseInt(filters.bedrooms, 10);
    if (!isNaN(parsed)) query.bedrooms = parsed;
  }

  return query;
}

/**
 * Parse budget input string to number.
 * Handles "50L", "1Cr", "5000000", etc.
 */
function parseBudgetInput(input: string): number | undefined {
  const trimmed = input.trim().toUpperCase();

  if (!trimmed) return undefined;

  // Handle "Cr" suffix
  if (trimmed.endsWith('CR')) {
    const num = parseFloat(trimmed.replace('CR', ''));
    if (!isNaN(num)) return Math.round(num * 10000000);
  }

  // Handle "L" or "Lakh" suffix
  if (trimmed.endsWith('L') || trimmed.includes('LAKH')) {
    const num = parseFloat(trimmed.replace(/L(?:AKH)?/g, ''));
    if (!isNaN(num)) return Math.round(num * 100000);
  }

  // Handle raw number
  const num = parseFloat(trimmed);
  if (!isNaN(num)) return Math.round(num);

  return undefined;
}

/**
 * Convert SearchQuery to URL search params.
 */
export function queryToSearchParams(query: SearchQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.location) params.set('location', query.location);
  if (query.propertyType) params.set('propertyType', query.propertyType);
  if (query.listingType && query.listingType !== 'ANY')
    params.set('listingType', query.listingType);
  if (query.minBudget) params.set('minBudget', String(query.minBudget));
  if (query.maxBudget) params.set('maxBudget', String(query.maxBudget));
  if (query.possessionStatus && query.possessionStatus !== 'ANY')
    params.set('possessionStatus', query.possessionStatus);
  if (query.bedrooms) params.set('bedrooms', String(query.bedrooms));
  if (query.sortBy && query.sortBy !== 'relevance') params.set('sortBy', query.sortBy);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit && query.limit !== 12) params.set('limit', String(query.limit));

  return params;
}

/**
 * Parse URL search params to SearchQuery.
 */
export function searchParamsToQuery(params: URLSearchParams): SearchQuery {
  const query: SearchQuery = {};

  const location = params.get('location');
  if (location) query.location = location;

  const propertyType = params.get('propertyType');
  if (propertyType) query.propertyType = propertyType as PropertyType;

  const listingType = params.get('listingType');
  if (listingType) query.listingType = listingType as 'NEW' | 'RESALE';

  const minBudget = params.get('minBudget');
  if (minBudget) query.minBudget = Number(minBudget);

  const maxBudget = params.get('maxBudget');
  if (maxBudget) query.maxBudget = Number(maxBudget);

  const possessionStatus = params.get('possessionStatus');
  if (possessionStatus)
    query.possessionStatus = possessionStatus as 'READY_TO_MOVE' | 'UNDER_CONSTRUCTION';

  const bedrooms = params.get('bedrooms');
  if (bedrooms) query.bedrooms = Number(bedrooms);

  const sortBy = params.get('sortBy');
  if (sortBy) query.sortBy = sortBy as 'relevance' | 'newest' | 'price_low' | 'price_high';

  const page = params.get('page');
  if (page) query.page = Number(page);

  const limit = params.get('limit');
  if (limit) query.limit = Number(limit);

  return query;
}

/**
 * Convert SearchQuery to SearchFilters for the UI form.
 */
export function queryToFilters(query: SearchQuery): SearchFilters {
  return {
    location: query.location || '',
    propertyType: query.propertyType || '',
    listingType: query.listingType || 'ANY',
    minBudget: query.minBudget ? formatBudgetForInput(query.minBudget) : '',
    maxBudget: query.maxBudget ? formatBudgetForInput(query.maxBudget) : '',
    possessionStatus: query.possessionStatus || 'ANY',
    bedrooms: query.bedrooms ? String(query.bedrooms) : '',
  };
}

/**
 * Format budget number for input display.
 */
function formatBudgetForInput(budget: number): string {
  if (budget >= 10000000) {
    const cr = budget / 10000000;
    return cr % 1 === 0 ? `${cr}Cr` : `${cr.toFixed(1)}Cr`;
  }
  if (budget >= 100000) {
    const l = budget / 100000;
    return l % 1 === 0 ? `${l}L` : `${l.toFixed(0)}L`;
  }
  return String(budget);
}

/**
 * Transform CRM Project API response to PublicProject DTO.
 * The API response includes inventory_summary and images from properties.
 */
export function toPublicProject(project: any): PublicProject {
  // The project's own cover image (set in the CRM's Media tab) is the
  // authoritative one; only fall back to a unit's photo if no cover was set.
  const primaryImage =
    project.cover_image_url ||
    project.properties?.[0]?.images?.find((img: any) => img.isPrimary)?.url ||
    project.properties?.[0]?.images?.[0]?.url ||
    null;

  // Collect all images from all properties
  const allImages = project.properties?.flatMap((prop: any) => prop.images || []) || [];

  return {
    id: project.id,
    projectCode: project.project_code,
    name: project.name,
    slug: project.slug,
    description: project.description,
    location: project.location,
    totalArea: project.total_area,
    launchDate: project.launch_date,
    status: project.status,
    amenities: Array.isArray(project.amenities) ? project.amenities : [],
    createdAt: project.created_at,
    inventorySummary: project.inventory_summary || { total: 0, available: 0, reserved: 0, sold: 0 },
    primaryImage,
    images: allImages.map((img: any) => ({
      id: img.id,
      url: img.image_url || img.url,
      isPrimary: img.is_primary || img.isPrimary,
      altText: img.alt_text || img.altText,
      sortOrder: img.sort_order || img.sortOrder,
    })),
  };
}

export function toPublicProjectList(projects: any[]): PublicProject[] {
  return projects.map(toPublicProject);
}

/**
 * Transform CRM Project Detail API response to PublicProjectDetail DTO.
 */
export function toPublicProjectDetail(project: any): PublicProjectDetail {
  const baseProject = toPublicProject(project);

  return {
    ...baseProject,
    properties:
      project.properties?.map((prop: any) => ({
        id: prop.id,
        title: prop.title,
        slug: prop.property_code,
        propertyType: prop.category?.toUpperCase().includes('APARTMENT')
          ? 'APARTMENT'
          : prop.category?.toUpperCase().includes('VILLA')
            ? 'VILLA'
            : 'INDEPENDENT_HOUSE',
        listingType: prop.listing_type === 'RESALE' ? 'RESALE' : 'NEW',
        price: prop.price,
        priceFormatted: formatPrice(prop.price),
        location: prop.location,
        areaSqft: prop.area_sqft,
        areaFormatted: formatArea(prop.area_sqft),
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        facing: prop.facing,
        possessionStatus: prop.possession_status,
        primaryImage:
          prop.images?.find((img: any) => img.isPrimary)?.url || prop.images?.[0]?.url || null,
        images:
          prop.images?.map((img: any) => ({
            id: img.id,
            url: img.image_url || img.url,
            isPrimary: img.is_primary || img.isPrimary,
            altText: img.alt_text || img.altText,
            sortOrder: img.sort_order || img.sortOrder,
          })) || [],
        amenities: Array.isArray(prop.amenities)
          ? prop.amenities
          : typeof prop.amenities === 'string'
            ? JSON.parse(prop.amenities)
            : [],
        isVerified: false,
        createdAt: prop.created_at,
      })) || [],
  };
}

/**
 * Transform CRM Property to PublicPropertyDetail DTO (full detail view).
 * Excludes: seller data, internal notes, exact coordinates, workflow state.
 */

const ALLOWED_DETAIL_KEYS = new Set([
  'plot_area',
  'plotArea',
  'land_area',
  'floor',
  'floor_no',
  'total_floors',
  'parking',
  'parking_slots',
  'car_parking',
  'rera',
  'rera_status',
  'rera_number',
  'balcony',
  'balconies',
  'age',
  'furnishing',
]);

function sanitizeDetails(rawDetails: any): Record<string, string | number | boolean> | null {
  if (!rawDetails || typeof rawDetails !== 'object' || Array.isArray(rawDetails)) return null;

  const safeDetails: Record<string, string | number | boolean> = {};
  for (const key of ALLOWED_DETAIL_KEYS) {
    if (key in rawDetails) {
      const val = rawDetails[key];
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        safeDetails[key] = val;
      }
    }
  }
  return Object.keys(safeDetails).length > 0 ? safeDetails : null;
}
export function toPublicPropertyDetail(property: Property): PublicPropertyDetail {
  const primaryImage = property.images?.find((img) => img.is_primary);
  const allImages = property.images || [];

  return {
    ...toPublicProperty(property),
    propertyCode: property.property_code,
    description: property.description,
    address: property.address,
    amenities: parseAmenities(property.amenities),
    possessionStatus: property.possession_status,
    details: sanitizeDetails(property.details),
    seoTitle: property.seo_title,
    seoKeywords: property.seo_keywords,
    state: property.state,
    city: property.city,
    locality: property.locality,
    pincode: property.pincode,
    listingType: property.listing_type === 'RESALE' ? 'RESALE' : 'NEW',
    images: allImages.map(toPublicPropertyImageDetail),
    project: property.project ? toPublicProjectReference(property.project) : null,
  };
}

function toPublicPropertyImageDetail(image: PropertyImage): PublicPropertyImage {
  return {
    id: image.id,
    url: image.image_url,
    isPrimary: image.is_primary,
    altText: image.alt_text,
    sortOrder: image.sort_order,
  };
}

function toPublicProjectReference(project: ProjectReference): PublicProjectReference {
  return {
    id: project.id,
    projectCode: project.project_code,
    name: project.name,
    location: project.location,
    status: project.status,
  };
}
