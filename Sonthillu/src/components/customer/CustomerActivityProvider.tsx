'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addGuestCompare,
  clearGuestCompare,
  readGuestCompare,
  readGuestShortlist,
  removeGuestCompare,
  removeGuestShortlist,
  replaceGuestCompare,
  toggleGuestShortlist,
} from '@/lib/customer/guest';
import { COMPARE_LIMIT, type CompareAddResult } from '@/lib/customer/service';
import {
  buildCustomerActivityEvent,
  trackCustomerActivityEvent,
  type CustomerActivitySurface,
} from '@/lib/customer/activity';
import {
  addToCompareAction,
  addToShortlistAction,
  clearCompareAction,
  removeFromCompareAction,
  removeFromShortlistAction,
  replaceCompareAction,
} from '@/app/actions/customer';
import { mergeGuestActivityAction } from '@/app/actions/customer';
import { useWebsiteAccount } from '@/lib/auth/useWebsiteAccount';
import type { StorageLike } from '@/lib/customer/types';

type ActivityMode = 'guest' | 'customer';

interface CustomerActivityContextValue {
  shortlist: number[];
  compare: number[];
  compareLimit: number;
  mode: ActivityMode;
  isShortlisted: (propertyId: number) => boolean;
  isCompared: (propertyId: number) => boolean;
  addToShortlist: (propertyId: number, surface?: CustomerActivitySurface) => void;
  removeFromShortlist: (propertyId: number, surface?: CustomerActivitySurface) => void;
  toggleShortlist: (propertyId: number, surface?: CustomerActivitySurface) => void;
  addCompare: (propertyId: number, surface?: CustomerActivitySurface) => CompareAddResult;
  removeCompare: (propertyId: number, surface?: CustomerActivitySurface) => void;
  replaceCompare: (index: number, propertyId: number) => void;
  clearCompare: () => void;
}

const CustomerActivityContext = createContext<CustomerActivityContextValue | null>(null);

function getStorage(): StorageLike | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

/**
 * Client-side customer activity boundary (shortlist/compare).
 *
 * - Guest mode (default): temporary state persisted in localStorage as
 *   non-sensitive property IDs only.
 * - Customer mode: every mutation calls an authenticated server action;
 *   ownership is enforced server-side by the session (`requireCustomer`).
 *   On login, guest localStorage state is merged into the customer account.
 */
export function CustomerActivityProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAccountLoading } = useWebsiteAccount();
  const [shortlist, setShortlist] = useState<number[]>([]);
  const [compare, setCompare] = useState<number[]>([]);
  const [mode, setMode] = useState<ActivityMode>('guest');

  // Initialise from guest localStorage.
  useEffect(() => {
    const storage = getStorage();
    if (!storage) return;
    setShortlist(readGuestShortlist(storage));
    setCompare(readGuestCompare(storage));
  }, []);

  // Switch mode once the WebsiteAccount context resolves whether a token
  // (and thus a logged-in account) exists.
  useEffect(() => {
    if (isAccountLoading) return;
    setMode(isAuthenticated ? 'customer' : 'guest');
  }, [isAccountLoading, isAuthenticated]);

  // Merge guest localStorage into customer account when mode switches to customer.
  useEffect(() => {
    if (mode !== 'customer') return;
    const storage = getStorage();
    if (!storage) return;

    const guestShortlist: number[] = JSON.parse(storage.getItem('sonthillu_shortlist') || '[]');
    const guestCompare: number[] = JSON.parse(storage.getItem('sonthillu_compare') || '[]');

    if (guestShortlist.length > 0 || guestCompare.length > 0) {
      void mergeGuestActivityAction(guestShortlist, guestCompare).then(() => {
        storage.removeItem('sonthillu_shortlist');
        storage.removeItem('sonthillu_compare');
        // Reset local state — server actions will revalidate paths
        setShortlist([]);
        setCompare([]);
      });
    }
  }, [mode]);

  const isShortlisted = useCallback(
    (propertyId: number) => shortlist.includes(propertyId),
    [shortlist]
  );

  const isCompared = useCallback((propertyId: number) => compare.includes(propertyId), [compare]);

  const addToShortlist = useCallback(
    (propertyId: number, surface?: CustomerActivitySurface) => {
      const storage = getStorage();
      if (mode === 'customer') {
        void addToShortlistAction(propertyId);
        setShortlist((prev) => (prev.includes(propertyId) ? prev : [propertyId, ...prev]));
        trackCustomerActivityEvent(
          buildCustomerActivityEvent('shortlist_add', { propertyId, surface })
        );
        return;
      }
      if (!storage) return;
      const { ids } = toggleGuestShortlist(storage, propertyId);
      setShortlist(ids);
      trackCustomerActivityEvent(
        buildCustomerActivityEvent('shortlist_add', {
          propertyId,
          surface,
          activityCount: ids.length,
        })
      );
    },
    [mode]
  );

  const removeFromShortlist = useCallback(
    (propertyId: number, surface?: CustomerActivitySurface) => {
      const storage = getStorage();
      if (mode === 'customer') {
        void removeFromShortlistAction(propertyId);
        setShortlist((prev) => prev.filter((id) => id !== propertyId));
        trackCustomerActivityEvent(
          buildCustomerActivityEvent('shortlist_remove', { propertyId, surface })
        );
        return;
      }
      if (!storage) return;
      const ids = removeGuestShortlist(storage, propertyId);
      setShortlist(ids);
      trackCustomerActivityEvent(
        buildCustomerActivityEvent('shortlist_remove', {
          propertyId,
          surface,
          activityCount: ids.length,
        })
      );
    },
    [mode]
  );

  const toggleShortlist = useCallback(
    (propertyId: number, surface?: CustomerActivitySurface) => {
      if (shortlist.includes(propertyId)) {
        removeFromShortlist(propertyId, surface);
      } else {
        addToShortlist(propertyId, surface);
      }
    },
    [shortlist, addToShortlist, removeFromShortlist]
  );

  const addCompare = useCallback(
    (propertyId: number, surface?: CustomerActivitySurface): CompareAddResult => {
      const storage = getStorage();
      if (mode === 'customer') {
        void addToCompareAction(propertyId);
        setCompare((prev) =>
          prev.includes(propertyId) || prev.length >= COMPARE_LIMIT ? prev : [...prev, propertyId]
        );
        trackCustomerActivityEvent(
          buildCustomerActivityEvent('compare_add', { propertyId, surface })
        );
        return 'added';
      }
      if (!storage) return 'limit_reached';
      const { ids, status } = addGuestCompare(storage, propertyId, COMPARE_LIMIT);
      setCompare(ids);
      if (status === 'added') {
        trackCustomerActivityEvent(
          buildCustomerActivityEvent('compare_add', {
            propertyId,
            surface,
            activityCount: ids.length,
          })
        );
      }
      return status;
    },
    [mode]
  );

  const removeCompare = useCallback(
    (propertyId: number, surface?: CustomerActivitySurface) => {
      const storage = getStorage();
      if (mode === 'customer') {
        void removeFromCompareAction(propertyId);
        setCompare((prev) => prev.filter((id) => id !== propertyId));
        trackCustomerActivityEvent(
          buildCustomerActivityEvent('compare_remove', { propertyId, surface })
        );
        return;
      }
      if (!storage) return;
      const ids = removeGuestCompare(storage, propertyId);
      setCompare(ids);
      trackCustomerActivityEvent(
        buildCustomerActivityEvent('compare_remove', {
          propertyId,
          surface,
          activityCount: ids.length,
        })
      );
    },
    [mode]
  );

  const replaceCompare = useCallback(
    (index: number, propertyId: number) => {
      const storage = getStorage();
      if (mode === 'customer') {
        void replaceCompareAction(index, propertyId);
        setCompare((prev) => {
          const removed = prev.filter((_, i) => i !== index);
          const deduped = removed.filter((id) => id !== propertyId);
          const next = [...deduped.slice(0, index), propertyId, ...deduped.slice(index)].slice(
            0,
            COMPARE_LIMIT
          );
          return next;
        });
        return;
      }
      if (!storage) return;
      const ids = replaceGuestCompare(storage, index, propertyId, COMPARE_LIMIT);
      setCompare(ids);
    },
    [mode]
  );

  const clearCompare = useCallback(() => {
    const storage = getStorage();
    if (mode === 'customer') {
      void clearCompareAction();
      setCompare([]);
      return;
    }
    if (!storage) return;
    clearGuestCompare(storage);
    setCompare([]);
  }, [mode]);

  const value = useMemo<CustomerActivityContextValue>(
    () => ({
      shortlist,
      compare,
      compareLimit: COMPARE_LIMIT,
      mode,
      isShortlisted,
      isCompared,
      addToShortlist,
      removeFromShortlist,
      toggleShortlist,
      addCompare,
      removeCompare,
      replaceCompare,
      clearCompare,
    }),
    [
      shortlist,
      compare,
      mode,
      isShortlisted,
      isCompared,
      addToShortlist,
      removeFromShortlist,
      toggleShortlist,
      addCompare,
      removeCompare,
      replaceCompare,
      clearCompare,
    ]
  );

  return (
    <CustomerActivityContext.Provider value={value}>{children}</CustomerActivityContext.Provider>
  );
}

export function useCustomerActivity(): CustomerActivityContextValue {
  const context = useContext(CustomerActivityContext);
  if (!context) {
    throw new Error('useCustomerActivity must be used within CustomerActivityProvider');
  }
  return context;
}
