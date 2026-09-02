const CACHE = 'dodelay-v3';

const isDevModule = (url) =>
  url.pathname.startsWith('/src/') ||
  url.pathname.startsWith('/@vite') ||
  url.pathname.startsWith('/@react-refresh') ||
  url.pathname.startsWith('/@fs/') ||
  url.pathname.startsWith('/node_modules/');

const isAsset = (url) =>
  url.pathname.startsWith('/assets/') ||
  /\.(png|jpg|jpeg|svg|webp|ico|woff2?|json|webmanifest)$/i.test(url.pathname);
const SHELL = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  '/favicon-32.png',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .catch(() => null)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isDevModule(url)) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || Response.error())),
    );
    return;
  }

  if (!isAsset(url)) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const copy = response.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return response;
          })
          .catch(() => cached || Response.error()),
    ),
  );
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {};
  }

  const title = payload.title || 'Доделай.ру';
  const body = payload.body || 'Есть новое событие по вашему заданию.';
  const kind = payload.kind || 'general';
  const jobId = payload.jobId || '';
  const url = payload.url || '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: kind + (jobId || ''),
      renotify: true,
      data: { url },
      vibrate: [80, 40, 80],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url && new URL(client.url).origin === self.location.origin) {
          if ('focus' in client) {
            const focused = client.focus();
            if ('navigate' in client) {
              return Promise.resolve(focused).then(() => client.navigate(url).catch(() => null));
            }
            return focused;
          }
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});