const ANON_ID_STORAGE_KEY = 'sonthillu_anon_id';

/**
 * Was set as an httpOnly cookie by middleware.ts — middleware doesn't run
 * under `output: 'export'` (no server at request time), so this moved to
 * localStorage, generated client-side on first use. Same purpose: a stable
 * per-browser id for anonymous activity tracking (WebsiteActivityEvent) and
 * recently-viewed lookups until a visitor logs into a WebsiteAccount.
 */
export function getOrCreateAnonId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let id = window.localStorage.getItem(ANON_ID_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(ANON_ID_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}
