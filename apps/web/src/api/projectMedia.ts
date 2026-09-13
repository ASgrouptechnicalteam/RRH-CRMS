// Typed fetch wrappers for the Project Media/Documents/Activity endpoints
// (apps/api/src/routes/projects/core.ts). Mirrors amenities.ts's conventions.

import { API_BASE_URL } from '../config';

type FetchWithAuth = (url: string, options?: RequestInit) => Promise<Response>;

export type ProjectMediaKind =
  'COVER' | 'GALLERY' | 'VIDEO' | 'BROCHURE' | 'MASTER_PLAN' | 'LAYOUT_PLAN' | 'FLOOR_PLAN';
export type ProjectDocumentKind = 'RERA' | 'APPROVAL' | 'LEGAL' | 'OTHER';

export interface ProjectMedia {
  id: number;
  project_id: number;
  kind: ProjectMediaKind;
  url: string;
  title: string | null;
  sort_order: number;
  uploaded_by_id: number | null;
  created_at: string;
}

export interface ProjectDocument {
  id: number;
  project_id: number;
  kind: ProjectDocumentKind;
  url: string;
  title: string | null;
  uploaded_by_id: number | null;
  created_at: string;
}

export interface ProjectActivityEvent {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  actor_id: number;
  actor_name: string | null;
  metadata: any;
  created_at: string;
}

async function asJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const message = data?.error || data?.message || 'Request failed';
    throw { res, data, message };
  }
  return data as T;
}

export function listProjectMedia(fetchWithAuth: FetchWithAuth, projectId: number) {
  return fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/media`).then((res) =>
    asJson<{ media: ProjectMedia[] }>(res),
  );
}

export function uploadProjectMedia(
  fetchWithAuth: FetchWithAuth,
  projectId: number,
  file: File,
  kind: ProjectMediaKind,
  title?: string,
) {
  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);
  if (title) form.append('title', title);
  return fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/media`, {
    method: 'POST',
    body: form,
  }).then((res) => asJson<{ message: string; media: ProjectMedia }>(res));
}

export function deleteProjectMedia(
  fetchWithAuth: FetchWithAuth,
  projectId: number,
  mediaId: number,
) {
  return fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/media/${mediaId}`, {
    method: 'DELETE',
  }).then((res) => asJson<{ deleted: boolean }>(res));
}

export function listProjectDocuments(fetchWithAuth: FetchWithAuth, projectId: number) {
  return fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/documents`).then((res) =>
    asJson<{ documents: ProjectDocument[] }>(res),
  );
}

export function uploadProjectDocument(
  fetchWithAuth: FetchWithAuth,
  projectId: number,
  file: File,
  kind: ProjectDocumentKind,
  title?: string,
) {
  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);
  if (title) form.append('title', title);
  return fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/documents`, {
    method: 'POST',
    body: form,
  }).then((res) => asJson<{ message: string; document: ProjectDocument }>(res));
}

export function deleteProjectDocument(
  fetchWithAuth: FetchWithAuth,
  projectId: number,
  documentId: number,
) {
  return fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/documents/${documentId}`, {
    method: 'DELETE',
  }).then((res) => asJson<{ deleted: boolean }>(res));
}

export function listProjectActivity(fetchWithAuth: FetchWithAuth, projectId: number) {
  return fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/activity`).then((res) =>
    asJson<{ events: ProjectActivityEvent[] }>(res),
  );
}
