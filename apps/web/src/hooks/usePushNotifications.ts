/**
 * usePushNotifications.ts
 *
 * Manages Web Push subscription lifecycle.
 * 
 * Key design: We track two things separately:
 *   1. browser `Notification.permission` — whether the OS allows notifications at all
 *   2. `isEnabled` (localStorage) — user's in-app toggle state
 * 
 * This way the toggle works cleanly even though browser permission
 * can only be revoked from browser settings once granted.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

type PermissionState = 'default' | 'granted' | 'denied';

const ENABLED_KEY = 'rrh_push_enabled';

export function usePushNotifications() {
  const { fetchWithAuth } = useAuth();

  const [permission, setPermission] = useState<PermissionState>(
    typeof Notification !== 'undefined' ? (Notification.permission as PermissionState) : 'denied'
  );

  // In-app toggle state — defaults to ON if permission was previously granted
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(ENABLED_KEY);
    if (stored !== null) return stored === 'true';
    // Default: enabled if already granted
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  });

  const [isSubscribing, setIsSubscribing] = useState(false);

  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  // Convert base64url VAPID key to Uint8Array
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      setIsSubscribing(true);

      // 1. Request browser notification permission
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      if (result !== 'granted') return false;

      // 2. Get VAPID public key from backend (graceful fallback if not configured)
      let publicKey: string | null = null;
      try {
        const keyRes = await fetch(`${API_BASE_URL}/push/vapid-public-key`);
        if (keyRes.ok) {
          const body = await keyRes.json();
          publicKey = body.publicKey || null;
        }
      } catch {
        // VAPID not configured — in-app notifications still work, just no background push
      }

      if (publicKey) {
        // 3. Subscribe via Service Worker
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });

        // 4. Send subscription to backend
        const subJson = subscription.toJSON();
        await fetchWithAuth(`${API_BASE_URL}/push/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        });
      }

      // Mark enabled in local state
      localStorage.setItem(ENABLED_KEY, 'true');
      setIsEnabled(true);
      return true;
    } catch (error) {
      console.error('[PushNotifications] Subscribe failed:', error);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported, fetchWithAuth]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    // Mark disabled in local state immediately (UI responds instantly)
    localStorage.setItem(ENABLED_KEY, 'false');
    setIsEnabled(false);

    if (!isSupported) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await fetchWithAuth(`${API_BASE_URL}/push/unsubscribe`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {}); // Don't block UI on network error
      }
    } catch (error) {
      console.error('[PushNotifications] Unsubscribe failed:', error);
    }
  }, [isSupported, fetchWithAuth]);

  // The effective "on" state — both permission granted AND user hasn't toggled off
  const isActive = permission === 'granted' && isEnabled;

  return { isSupported, permission, isEnabled, isActive, isSubscribing, subscribe, unsubscribe };
}
