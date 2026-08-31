import { API_BASE_URL } from '../config';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export const resolveImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const base = import.meta.env.VITE_API_ORIGIN || API_ORIGIN;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const mediaUrl = resolveImageUrl;
