const CACHE_NAME = 'campusflow-v1';
const OFFLINE_PAGE = '/offline.html';

self.addEventListener('install', function (event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('Cache opened');
      return cache.addAll([
        '/',
        OFFLINE_PAGE,
      ]).catch(err => {
        console.log('Cache addAll error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Notification', body: event.data?.text() };
  }

  const title = data.title || 'CampusFlow';
  const options = {
    body: data.body || '',
    data: data.data || {},
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === url && 'focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});

self.addEventListener('fetch', function (event) {
  // For GET requests, try network first, fallback to cache
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match(event.request).then(function (response) {
          return response || caches.match(OFFLINE_PAGE);
        });
      })
    );
  }
});
