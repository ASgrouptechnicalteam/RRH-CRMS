// Typed fetch wrappers for the Amenity catalog + per-project amenity
// endpoints built in Phase 3 (apps/api/src/routes/amenities.ts,
// .../projects/amenities.ts). Mirrors projectUnits.ts's conventions.

import { API_BASE_URL } from '../config';
import { ChargeCalcMethod, UnitType } from './projectUnits';

type FetchWithAuth = (url: string, options?: RequestInit) => Promise<Response>;

export type AmenityCategory =
  'SECURITY' | 'RECREATION' | 'CONVENIENCE' | 'ENVIRONMENT' | 'SPORTS' | 'UTILITY' | 'OTHER';
export type AmenityAvailability = 'INCLUDED' | 'OPTIONAL' | 'CHARGEABLE';
export type AmenityApplicability = 'ALL_UNITS' | 'SELECTED_UNITS' | 'BY_UNIT_TYPE';

export interface Amenity {
  id: number;
  company_id: number;
  name: string;
  icon: string | null;
  category: AmenityCategory;
  is_active: boolean;
}

export interface ProjectAmenityInput {
  availability: AmenityAvailability;
  charge_calc_method?: ChargeCalcMethod | null;
  charge_amount?: number | null;
  applicability?: AmenityApplicability;
  applicable_unit_type?: UnitType | null;
  selected_unit_ids?: number[];
  notes?: string | null;
  sort_order?: number;
}

export interface ProjectAmenity extends ProjectAmenityInput {
  id: number;
  project_id: number;
  amenity_id: number;
  amenity: Amenity;
}

async function asJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const message = data?.error || data?.message || 'Request failed';
    throw { res, data, message };
  }
  return data as T;
}

// ---- Company-wide catalog ---------------------------------------------------

export function listAmenityCatalog(fetchWithAuth: FetchWithAuth) {
  return fetchWithAuth(`${API_BASE_URL}/amenities`).then((res) =>
    asJson<{ amenities: Amenity[] }>(res),
  );
}

export function createCatalogAmenity(
  fetchWithAuth: FetchWithAuth,
  data: { name: string; icon?: string | null; category?: AmenityCategory },
) {
  return fetchWithAuth(`${API_BASE_URL}/amenities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => asJson<{ message: string; amenity: Amenity }>(res));
}

export function updateCatalogAmenity(
  fetchWithAuth: FetchWithAuth,
  amenityId: number,
  data: Partial<{
    name: string;
    icon: string | null;
    category: AmenityCategory;
    is_active: boolean;
  }>,
) {
  return fetchWithAuth(`${API_BASE_URL}/amenities/${amenityId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => asJson<{ message: string; amenity: Amenity }>(res));
}

export function deleteCatalogAmenity(fetchWithAuth: FetchWithAuth, amenityId: number) {
  return fetchWithAuth(`${API_BASE_URL}/amenities/${amenityId}`, { method: 'DELETE' }).then((res) =>
    asJson<{ deactivated: boolean }>(res),
  );
}

// ---- Per-project configuration ----------------------------------------------

export function listProjectAmenities(fetchWithAuth: FetchWithAuth, projectId: number) {
  return fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/amenities`).then((res) =>
    asJson<{ amenities: ProjectAmenity[] }>(res),
  );
}

export function setProjectAmenity(
  fetchWithAuth: FetchWithAuth,
  projectId: number,
  amenityId: number,
  data: ProjectAmenityInput,
) {
  return fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/amenities/${amenityId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => asJson<{ message: string; amenity: ProjectAmenity }>(res));
}

export function removeProjectAmenity(
  fetchWithAuth: FetchWithAuth,
  projectId: number,
  amenityId: number,
) {
  return fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/amenities/${amenityId}`, {
    method: 'DELETE',
  }).then((res) => asJson<{ removed: boolean }>(res));
}
