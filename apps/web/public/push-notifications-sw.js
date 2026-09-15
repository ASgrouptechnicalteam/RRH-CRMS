// ─────────────────────────────────────────────────────────────
// Web Push Notifications Handling
//
// Pulled into the Workbox-generated service worker via the `workbox.
// importScripts` option in vite.config.ts, instead of living in its own
// sw.js — VitePWA's default `generateSW` strategy replaces
// dist/sw.js with a wholly auto-generated file on every build, so a
// hand-written sw.js containing this same logic would get silently
// discarded (which is exactly what happened before: push notifications
// were "sent" successfully by the backend, arrived at the browser, and
// were dropped on the floor because the shipped service worker had no
// `push` listener to catch them).
// ─────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const title = data.title || 'New Notification';
    const options = {
      body: data.message,
      // Prefer whatever icon/badge the payload sent (notifyEmployee.ts on
      // the backend sets both to /logo.svg) — fall back to a file that
      // actually exists in public/ rather than the old hardcoded
      // /icons/icon-*.png paths, which pointed at a directory that was
      // never created.
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.link || '/',
        type: data.type,
      },
      tag: data.type || 'rrh-alert',
      renotify: true, // If we get another of the same type, alert the user again
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
