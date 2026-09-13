// Phase 1.7 (2026-09-06): the backend's duplicate '/api/v1/internal' namespace
// (an abandoned mid-migration) was removed — '/api/v1' is the one real
// deployments actually use (see apps/web/.env / .env.production). Default
// here now matches that instead of the dead namespace.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const STATIC_URL = API_BASE_URL.replace('/api/v1', '');

export function mediaUrl(path?: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = import.meta.env.VITE_API_ORIGIN || STATIC_URL;
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
}
