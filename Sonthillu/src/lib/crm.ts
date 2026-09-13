import { z } from 'zod';
import type {
  Property,
  PropertyListResponse,
  PropertyFilters,
  ProjectReference,
} from '../types/property';
import type { Project } from '../types/project';
import type { PublicPropertyDetail, PublicProject, PublicProjectDetail } from '../types/search';
import { toPublicPropertyDetail, toPublicProject, toPublicProjectDetail } from './dto';

// Talks to the CRM (apps/api) directly — the Sonthillu-Backend BFF this used
// to call is retired (consolidation plan, Decision 5). Must be NEXT_PUBLIC_*:
// a static export has no server at request time, so anything read here has
// to already be inlined into the client bundle at build time.
function getBackendUrl() {
  return process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'http://localhost:3000/api/v1';
}

function getApiKey() {
  return process.env.NEXT_PUBLIC_CRM_API_KEY || '';
}

const BRAND = 'sonthillu';

interface CRMRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

interface NextFetchRequestConfig {
  revalidate?: number | false;
  tags?: string[];
}

async function backendFetch<T>(endpoint: string, options: CRMRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, cache = 'force-cache', next } = options;
  const backendUrl = getBackendUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': getApiKey(),
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
    cache,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  if (next) {
    (fetchOptions as Record<string, unknown>).next = next;
  }

  const url = `${backendUrl}/public/${BRAND}${endpoint}`;

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    const err = new Error(error.error || `Backend API error: ${response.status}`);
    (err as any).status = response.status;
    throw err;
  }

  return response.json();
}

export async function getPublishedProperties(
  filters?: PropertyFilters
): Promise<{ data: Property[]; error: boolean }> {
  const params = new URLSearchParams();

  if (filters?.location) params.set('location', filters.location);

  if (filters?.category) params.set('category', filters.category);
  if (filters?.listing_type && filters.listing_type !== 'ANY')
    params.set('listing_type', filters.listing_type);
  if (filters?.bedrooms_min) params.set('bedrooms_min', String(filters.bedrooms_min));
  if (filters?.bedrooms_max) params.set('bedrooms_max', String(filters.bedrooms_max));
  if (filters?.budget_min) params.set('budget_min', String(filters.budget_min));
  if (filters?.budget_max) params.set('budget_max', String(filters.budget_max));
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.sort && filters.sort !== 'relevance') params.set('sort', filters.sort);

  const queryString = params.toString();
  const endpoint = `/properties${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await backendFetch<Property[]>(endpoint, {
      next: { revalidate: 300 },
    });

    // Filter out commercial properties to prevent collisions with Radha Real Home
    const residentialTypes = [
      'APARTMENT',
      'VILLA',
      'INDEPENDENT_HOUSE',
      'PLOT',
      'AGRICULTURAL_LAND',
    ];
    const filteredData = response.filter(
      (p) =>
        residentialTypes.includes(p.category) || residentialTypes.includes((p as any).propertyType)
    );

    return { data: filteredData, error: false };
  } catch (error: any) {
    if (error?.digest === 'DYNAMIC_SERVER_USAGE') throw error;
    if (error?.status >= 500 || error?.code === 'ECONNREFUSED') {
      console.warn(`Backend unavailable (Property fetch failed): ${error.message}`);
    } else {
      console.error('Failed to fetch published properties:', error);
    }
    return { data: [], error: true };
  }
}

export async function getPropertyById(id: number): Promise<Property | null> {
  try {
    const response = await backendFetch<Property>(`/properties/${id}`, {
      next: { revalidate: 300 },
    });
    return response;
  } catch (error: any) {
    if (error.status === 404) return null;
    console.error(`Failed to fetch property ${id}:`, error);
    throw error;
  }
}

export async function getPropertyByCode(code: string): Promise<Property | null> {
  try {
    const response = await backendFetch<Property>(`/properties/code/${code}`, {
      next: { revalidate: 300 },
    });
    return response;
  } catch (error: any) {
    if (error.status === 404) return null;
    console.error(`Failed to fetch property by code ${code}:`, error);
    throw error;
  }
}

export async function getPropertyDetailById(id: number): Promise<PublicPropertyDetail | null> {
  try {
    const property = await backendFetch<Property>(`/properties/${id}`, {
      next: { revalidate: 300 },
    });
    return toPublicPropertyDetail(property);
  } catch (error: any) {
    if (error.status === 404) return null;
    console.error(`Failed to fetch property detail ${id}:`, error);
    throw error;
  }
}

export async function getPropertyDetailByCode(code: string): Promise<PublicPropertyDetail | null> {
  try {
    const property = await backendFetch<Property>(`/properties/code/${code}`, {
      next: { revalidate: 300 },
    });
    return toPublicPropertyDetail(property);
  } catch (error: any) {
    if (error.status === 404) return null;
    console.error(`Failed to fetch property detail by code ${code}:`, error);
    throw error;
  }
}

export async function getProjects(): Promise<Project[]> {
  try {
    const response = await backendFetch<Project[]>('/projects', {
      next: { revalidate: 600 },
    });
    return response;
  } catch (error: any) {
    if (error?.status >= 500 || error?.code === 'ECONNREFUSED') {
      console.warn(`Backend unavailable (Projects fetch failed): ${error.message}`);
    } else {
      console.error('Failed to fetch projects:', error);
    }
    return [];
  }
}

export async function getProjectById(id: number): Promise<Project | null> {
  try {
    const response = await backendFetch<Project>(`/projects/${id}`, {
      next: { revalidate: 600 },
    });
    return response;
  } catch (error: any) {
    if (error.status === 404) return null;
    console.error(`Failed to fetch project ${id}:`, error);
    throw error;
  }
}

export async function getProjectByCode(code: string): Promise<Project | null> {
  try {
    const response = await backendFetch<Project>(`/projects/code/${code}`, {
      next: { revalidate: 600 },
    });
    return response;
  } catch (error: any) {
    if (error.status === 404) return null;
    console.error(`Failed to fetch project by code ${code}:`, error);
    throw error;
  }
}

export async function getPublishedProjects(): Promise<PublicProject[]> {
  try {
    const response = await backendFetch<any[]>('/projects', {
      next: { revalidate: 600 },
    });
    return response.map(toPublicProject);
  } catch (error: any) {
    if (error?.digest === 'DYNAMIC_SERVER_USAGE') throw error;
    if (error?.status >= 500 || error?.code === 'ECONNREFUSED') {
      console.warn(`Backend unavailable (Published projects fetch failed): ${error.message}`);
    } else {
      console.error('Failed to fetch published projects:', error);
    }
    return [];
  }
}

export async function getProjectDetailById(id: number): Promise<PublicProjectDetail | null> {
  try {
    const response = await backendFetch<any>(`/projects/${id}`, {
      next: { revalidate: 600 },
    });
    return toPublicProjectDetail(response);
  } catch (error: any) {
    if (error.status === 404) return null;
    console.error(`Failed to fetch project detail ${id}:`, error);
    throw error;
  }
}

export async function getProjectDetailByCode(code: string): Promise<PublicProjectDetail | null> {
  try {
    const response = await backendFetch<any>(`/projects/code/${code}`, {
      next: { revalidate: 600 },
    });
    return toPublicProjectDetail(response);
  } catch (error: any) {
    if (error.status === 404) return null;
    console.error(`Failed to fetch project detail by code ${code}:`, error);
    throw error;
  }
}

const LeadCreateSchema = z.object({
  customer_name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  property_type_preference: z.string().optional(),
  preferred_location: z.string().optional(),
  budget_max: z.number().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
});

export type LeadCreateInput = z.infer<typeof LeadCreateSchema>;

export async function createLead(data: LeadCreateInput): Promise<{ leadId: number }> {
  const validated = LeadCreateSchema.parse(data);

  const response = await backendFetch<{ message: string; leadId: number }>('/leads', {
    method: 'POST',
    body: validated,
    cache: 'no-store',
  });

  return { leadId: response.leadId };
}

export async function healthCheck(): Promise<boolean> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
