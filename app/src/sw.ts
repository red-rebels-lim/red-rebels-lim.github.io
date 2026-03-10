/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Workbox precaching — injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST);

// Skip waiting so the new SW activates immediately when deployed
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Claim all open tabs so they use the new SW right away
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  url?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    payload = { title: 'Red Rebels', body: event.data.text() };
  }

  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || '/images/clear_logo_192.png',
    badge: '/images/clear_logo_192.png',
    tag: payload.tag,
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const rawUrl = (event.notification.data?.url as string) || '/';
  const safeUrl = rawUrl.startsWith('/') || rawUrl.startsWith(self.location.origin) ? rawUrl : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if found
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new tab
      return self.clients.openWindow(safeUrl);
    })
  );
});
