export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1/internal';
export const STATIC_URL = API_BASE_URL.replace('/api/v1/internal', '').replace('/api/v1', '');

export function mediaUrl(path?: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = import.meta.env.VITE_API_ORIGIN || STATIC_URL;
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
}