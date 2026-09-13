// Typed fetch wrappers for the standalone Property endpoints (Rebuild Phase
// 5). Mirrors projectUnits.ts's conventions — the server is always the
// source of truth for calculated_price/final_price, this client never
// computes anything.

import { API_BASE_URL } from '../config';
import {
  AreaUnitCode,
  PriceBasisCode,
  ChargeCalcMethod,
  ChargeCategory,
  PriceLine,
  ManualPriceLineInput,
} from './projectUnits';

type FetchWithAuth = (url: string, options?: RequestInit) => Promise<Response>;

export type PropertyCategory =
  | 'APARTMENT'
  | 'INDEPENDENT_HOUSE'
  | 'DUPLEX'
  | 'INDEPENDENT_FLOOR'
  | 'VILLA'
  | 'PENTHOUSE'
  | 'STUDIO'
  | 'PLOT'
  | 'FARM_HOUSE'
  | 'AGRICULTURAL_LAND'
  | 'COMMERCIAL_SHOP'
  | 'COMMERCIAL_OFFICE';

export type PropertySalesStatus =
  'AVAILABLE' | 'HOLD' | 'RESERVED' | 'BOOKED' | 'SOLD' | 'BLOCKED' | 'UNAVAILABLE';
export type PropertyPipelineStatus =
  | 'PENDING_VERIFICATION'
  | 'PENDING_DM_POLISH'
  | 'PENDING_MD_APPROVAL'
  | 'LIVE'
  | 'REJECTED'
  | 'LOCKED'
  | 'BOOKED'
  | 'SOLD'
  | 'ARCHIVED';

/** Everything PropertyForm can send. Mirrors ProjectUnitInput's pricing/area
 * vocabulary (Phase 1's migration added these to Property so "one form
 * serves both" — Phase 5 finally wires them through this client). */
export interface PropertyInput {
  title: string;
  description?: string | null;
  brand_type: 'SONTHILLU' | 'RADHA_REAL_HOMES';
  category: PropertyCategory;
  area_sqft: number;
  location: string;
  address?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  facing?: string | null;
  amenities?: string | null;
  possession_status?: 'READY_TO_MOVE' | 'UNDER_CONSTRUCTION' | null;
  assigned_pm_id?: number | null;
  project_id?: number | null;
  state?: string | null;
  city?: string | null;
  locality?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  listing_type?: 'NEW' | 'RESALE';

  // Area / pricing (Phase 5)
  area_value?: number | null;
  area_unit?: AreaUnitCode | null;
  plot_area_sqyd?: number | null;
  plot_length_ft?: number | null;
  plot_width_ft?: number | null;
  carpet_area_sqft?: number | null;
  built_up_area_sqft?: number | null;
  super_built_up_area_sqft?: number | null;
  ground_floor_area_sqft?: number | null;
  first_floor_area_sqft?: number | null;
  total_floors?: number | null;
  construction_year?: number | null;
  price_basis?: PriceBasisCode;
  view?: string | null;
  road_width_ft?: number | null;
  is_corner?: boolean;
  is_park_facing?: boolean;
  is_road_facing?: boolean;
  is_main_road_facing?: boolean;
  is_premium_location?: boolean;
  base_rate?: number | null;
  base_rate_unit?: ChargeCalcMethod | null;
  discount_amount?: number | null;
  discount_reason?: string | null;
  manual_lines?: ManualPriceLineInput[];

  // Category-specific detail sub-records (property details.md spec) — only
  // the one matching `category` (see PropertyForm.tsx's detailKeyForCategory)
  // is ever populated/sent; loosely typed since each shape is genuinely
  // different per property type (see PropertyService's 7 Prisma sub-tables).
  plot_details?: Record<string, any> | null;
  apartment_details?: Record<string, any> | null;
  villa_details?: Record<string, any> | null;
  house_details?: Record<string, any> | null;
  commercial_shop_details?: Record<string, any> | null;
  commercial_office_details?: Record<string, any> | null;
  farm_land_details?: Record<string, any> | null;
}

export interface Property extends PropertyInput {
  id: number;
  property_code: string;
  status: PropertyPipelineStatus;
  sales_status: PropertySalesStatus;
  slug: string | null;
  area_sqyd: number | null;
  base_price: number;
  premiums_total: number;
  charges_total: number;
  taxes_total: number;
  calculated_price: number;
  override_price: number | null;
  override_reason: string | null;
  overridden_by_id: number | null;
  overridden_at: string | null;
  final_price: number;
  assigned_pm?: {
    id: number;
    employee_code: string;
    full_name: string;
    phone: string | null;
  } | null;
  price_lines?: PriceLine[];
  images?: { id: number; image_url: string; is_primary: boolean }[];
}

async function asJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const message = data?.error || data?.message || 'Request failed';
    throw { res, data, message };
  }
  return data as T;
}

export function listProperties(
  fetchWithAuth: FetchWithAuth,
  filters: {
    brand?: string;
    category?: string;
    status?: string;
    sales_status?: string;
    project_id?: number;
    limit?: number;
    offset?: number;
  } = {},
) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  return fetchWithAuth(`${API_BASE_URL}/properties${qs ? `?${qs}` : ''}`).then((res) =>
    asJson<{ properties: Property[]; pagination: { limit: number; offset: number } }>(res),
  );
}

export function getProperty(fetchWithAuth: FetchWithAuth, propertyId: number) {
  return fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}`).then((res) =>
    asJson<{ property: Property }>(res),
  );
}

export function createProperty(fetchWithAuth: FetchWithAuth, data: PropertyInput) {
  return fetchWithAuth(`${API_BASE_URL}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => asJson<{ message: string; property: Property }>(res));
}

export function updateProperty(
  fetchWithAuth: FetchWithAuth,
  propertyId: number,
  data: Partial<PropertyInput>,
) {
  return fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => asJson<{ property: Property }>(res));
}

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  alt_text: string | null;
  uploaded_by_id: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export function uploadPropertyImage(
  fetchWithAuth: FetchWithAuth,
  propertyId: number,
  file: File,
  isPrimary: boolean = false,
) {
  const form = new FormData();
  form.append('image', file);
  if (isPrimary) form.append('is_primary', 'true');
  return fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/images`, {
    method: 'POST',
    body: form,
  }).then((res) => asJson<{ message: string; image: PropertyImage }>(res));
}

export function setPropertyImagePrimary(
  fetchWithAuth: FetchWithAuth,
  propertyId: number,
  imageId: number,
) {
  return fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/images/${imageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_primary: true }),
  }).then((res) => asJson<{ message: string; image: PropertyImage }>(res));
}

export function deletePropertyImage(
  fetchWithAuth: FetchWithAuth,
  propertyId: number,
  imageId: number,
) {
  return fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/images/${imageId}`, {
    method: 'DELETE',
  }).then((res) => asJson<{ message: string }>(res));
}

// ---- Pricing rules (§ Phase 3) ---------------------------------------------
// Mirrors projectUnits.ts's PricingRule/PricingRuleInput, minus
// applies_to_unit_type and floor matching (a property already has one fixed
// category and no top-level numeric floor field).

export interface PropertyPricingRuleInput {
  label: string;
  kind: PriceLine['kind'];
  category: ChargeCategory;
  calc_method: ChargeCalcMethod;
  rate: number;
  area_basis?: PriceBasisCode | null;
  is_mandatory?: boolean;
  is_tax?: boolean;
  is_refundable?: boolean;
  is_active?: boolean;
  sort_order?: number;
  match_facing?: string | null;
  match_corner?: boolean | null;
  match_park_facing?: boolean | null;
  match_road_facing?: boolean | null;
  match_main_road_facing?: boolean | null;
}

export interface PropertyPricingRule extends PropertyPricingRuleInput {
  id: number;
  property_id: number;
}

export function listPropertyPricingRules(fetchWithAuth: FetchWithAuth, propertyId: number) {
  return fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/pricing-rules`).then((res) =>
    asJson<{ rules: PropertyPricingRule[] }>(res),
  );
}

export function createPropertyPricingRule(
  fetchWithAuth: FetchWithAuth,
  propertyId: number,
  data: PropertyPricingRuleInput,
) {
  return fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/pricing-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => asJson<{ message: string; rule: PropertyPricingRule }>(res));
}

export function updatePropertyPricingRule(
  fetchWithAuth: FetchWithAuth,
  propertyId: number,
  ruleId: number,
  data: Partial<PropertyPricingRuleInput>,
) {
  return fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/pricing-rules/${ruleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => asJson<{ message: string; rule: PropertyPricingRule }>(res));
}

export function deletePropertyPricingRule(
  fetchWithAuth: FetchWithAuth,
  propertyId: number,
  ruleId: number,
) {
  return fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/pricing-rules/${ruleId}`, {
    method: 'DELETE',
  }).then((res) => asJson<{ deactivated: boolean }>(res));
}

export interface PropertyPriceComputation {
  lines: PriceLine[];
  base_price: number;
  premiums_total: number;
  charges_total: number;
  discount_amount: number;
  calculated_price: number;
  taxes_total: number;
  all_inclusive_price: number;
  refundable_total: number;
  warnings: string[];
}

export function previewPropertyPrice(
  fetchWithAuth: FetchWithAuth,
  propertyId: number,
  input: Record<string, any> = {},
) {
  return fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/pricing/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((res) => asJson<{ computation: PropertyPriceComputation }>(res));
}

export function recalculatePropertyPrice(fetchWithAuth: FetchWithAuth, propertyId: number) {
  return fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/pricing/recalculate`, {
    method: 'POST',
  }).then((res) => asJson<{ message: string; property: Property }>(res));
}

export function overridePropertyPrice(
  fetchWithAuth: FetchWithAuth,
  propertyId: number,
  override_price: number | null,
  override_reason?: string | null,
) {
  return fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/override-price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ override_price, override_reason }),
  }).then((res) => asJson<{ message: string; property: Property }>(res));
}
