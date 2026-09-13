export interface PropertyImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  alt_text: string | null;
  sort_order: number;
}

export interface ProjectReference {
  id: number;
  project_code: string;
  name: string;
  location: string;
  status: string;
}

export interface Property {
  id: number;
  property_code: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  area_sqft: number;
  location: string;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  facing: string | null;
  amenities: string | null;
  possession_status: string | null;
  lifecycle_status?: string | null;
  details: Record<string, string | number | boolean> | null;
  seo_title: string | null;
  seo_keywords: string | null;
  created_at: string;
  images: PropertyImage[];
  state: string | null;
  city: string | null;
  locality: string | null;
  pincode: string | null;
  listing_type: string | null;
  project: ProjectReference | null;
}

export interface PropertyListResponse {
  properties: Property[];
  total: number;
}

export interface PropertyFilters {
  location?: string;
  category?: string;
  bedrooms_min?: number;
  bedrooms_max?: number;
  budget_min?: number;
  budget_max?: number;
  area_sqft_min?: number;
  area_sqft_max?: number;
  facing?: string;
  possession_status?: string;
  listing_type?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export type PropertyCategory =
  | 'APARTMENT'
  | 'INDEPENDENT_HOUSE'
  | 'DUPLEX'
  | 'INDEPENDENT_FLOOR'
  | 'VILLA'
  | 'PENTHOUSE'
  | 'STUDIO';

export const PROPERTY_CATEGORIES: { value: PropertyCategory; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment / Flat' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'INDEPENDENT_HOUSE', label: 'Independent House' },
  { value: 'INDEPENDENT_FLOOR', label: 'Independent Floor' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'STUDIO', label: 'Studio Apartment' },
];

export const BHK_OPTIONS = [
  { value: 1, label: '1 BHK' },
  { value: 2, label: '2 BHK' },
  { value: 3, label: '3 BHK' },
  { value: 4, label: '4 BHK' },
  { value: 5, label: '5+ BHK' },
];

export const FACING_OPTIONS = [
  { value: 'EAST', label: 'East' },
  { value: 'WEST', label: 'West' },
  { value: 'NORTH', label: 'North' },
  { value: 'SOUTH', label: 'South' },
  { value: 'NORTH_EAST', label: 'North East' },
  { value: 'SOUTH_EAST', label: 'South East' },
  { value: 'NORTH_WEST', label: 'North West' },
  { value: 'SOUTH_WEST', label: 'South West' },
];

export const POSSESSION_STATUS_OPTIONS = [
  { value: 'READY_TO_MOVE', label: 'Ready to Move' },
  { value: 'UNDER_CONSTRUCTION', label: 'Under Construction' },
];
