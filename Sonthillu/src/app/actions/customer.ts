import { CRM_CONFIG } from '@/lib/constants';
import type { ShortlistAddResult, CompareAddResult } from '@/lib/customer/service';
import { COMPARE_LIMIT } from '@/lib/customer/service';
import { isValidPropertyId } from '@/lib/customer/types';

// Was a set of Server Actions built on requireCustomer()/Sonthillu's own
// local Customer database — incompatible with `output: 'export'`, and a
// different (retiring) account system from WebsiteAccount besides. Now
// calls the CRM's WebsiteAccount shortlist/compare endpoints directly with
// the Bearer token from lib/auth/useWebsiteAccount.tsx's localStorage. Only
// used from CustomerActivityProvider when `mode === 'customer'` (a
// logged-in website account) — guest mode never reaches these.

const TOKEN_STORAGE_KEY = 'sonthillu_website_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function savedItemUrl(kind: 'shortlist' | 'compare') {
  const baseUrl = process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'http://localhost:3000/api/v1';
  return `${baseUrl}/public/${CRM_CONFIG.brandParameter}/account/${kind}`;
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_CRM_API_KEY || '';
  return {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function assertId(propertyId: unknown): asserts propertyId is number {
  if (!isValidPropertyId(propertyId)) {
    throw new Error('Invalid property id');
  }
}

async function addSavedItem(kind: 'shortlist' | 'compare', propertyId: number): Promise<void> {
  await fetch(savedItemUrl(kind), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ property_id: propertyId }),
    cache: 'no-store',
  });
}

async function removeSavedItem(kind: 'shortlist' | 'compare', propertyId: number): Promise<void> {
  await fetch(savedItemUrl(kind), {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ property_id: propertyId }),
    cache: 'no-store',
  });
}

export async function addToShortlistAction(propertyId: unknown): Promise<ShortlistAddResult> {
  assertId(propertyId);
  await addSavedItem('shortlist', propertyId);
  return 'added';
}

export async function removeFromShortlistAction(propertyId: unknown): Promise<boolean> {
  assertId(propertyId);
  await removeSavedItem('shortlist', propertyId);
  return true;
}

export async function addToCompareAction(propertyId: unknown): Promise<CompareAddResult> {
  assertId(propertyId);
  await addSavedItem('compare', propertyId);
  return 'added';
}

export async function removeFromCompareAction(propertyId: unknown): Promise<boolean> {
  assertId(propertyId);
  await removeSavedItem('compare', propertyId);
  return true;
}

export async function replaceCompareAction(_index: number, propertyId: unknown): Promise<boolean> {
  assertId(propertyId);
  await addSavedItem('compare', propertyId);
  return true;
}

export async function clearCompareAction(): Promise<void> {
  try {
    const res = await fetch(savedItemUrl('compare'), { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) return;
    const { items } = (await res.json()) as { items: { property_id: number }[] };
    await Promise.all(items.map((item) => removeSavedItem('compare', item.property_id)));
  } catch {
    // Best-effort — local state is cleared regardless by the caller.
  }
}

/**
 * Guest → customer migration, invoked after a successful login. Guest state
 * (localStorage-only property IDs) is merged into the account's CRM-backed
 * shortlist/compare, deduped, respecting COMPARE_LIMIT.
 */
export async function mergeGuestActivityAction(
  guestShortlist: unknown[],
  guestCompare: unknown[]
): Promise<void> {
  const shortlistIds = guestShortlist.filter(isValidPropertyId);
  const compareIds = guestCompare.filter(isValidPropertyId).slice(0, COMPARE_LIMIT);

  await Promise.all([
    ...shortlistIds.map((id) => addSavedItem('shortlist', id)),
    ...compareIds.map((id) => addSavedItem('compare', id)),
  ]);
}
