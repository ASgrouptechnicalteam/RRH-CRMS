/**
 * usePushNotifications.ts
 * 
 * Manages Web Push subscription lifecycle:
 *  - Requests permission from user
 *  - Subscribes to the push server using VAPID public key
 *  - Sends subscription to backend for storage
 *  - Returns { isSupported, permission, subscribe, unsubscribe }
 */

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

type PermissionState = 'default' | 'granted' | 'denied';

export function usePushNotifications() {
  const { fetchWithAuth } = useAuth();
  const [permission, setPermission] = useState<PermissionState>(
    typeof Notification !== 'undefined' ? (Notification.permission as PermissionState) : 'denied'
  );
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

      // 2. Get VAPID public key from backend
      const keyRes = await fetch(`${API_BASE_URL}/push/vapid-public-key`);
      if (!keyRes.ok) {
        console.warn('[PushNotifications] VAPID key not configured on server. Push disabled.');
        return false;
      }
      const { publicKey } = await keyRes.json();

      // 3. Subscribe via Service Worker
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as any,
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

      return true;
    } catch (error) {
      console.error('[PushNotifications] Subscribe failed:', error);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported, fetchWithAuth]);

  const unsubscribe = useCallback(async (): Promise<void> => {
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
        });
      }
    } catch (error) {
      console.error('[PushNotifications] Unsubscribe failed:', error);
    }
  }, [isSupported, fetchWithAuth]);

  return { isSupported, permission, isSubscribing, subscribe, unsubscribe };
}
