const CACHE_NAME = "campusflow-staff-v3";
const STATIC_ASSETS = ["/manifest.webmanifest", "/icons/pwa-192.svg", "/icons/pwa-512.svg"];

const isStaticAsset = (url) =>
  url.origin === self.location.origin &&
  (url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/"));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response("You are offline. Reconnect to open the latest CampusFlow staff page.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          }),
      ),
    );
    return;
  }

  if (!isStaticAsset(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match("/staff/lecturer"));
    }),
  );
});

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "CampusFlow Staff Portal";
  const options = {
    body: payload.body || "You have a new update.",
    icon: "/icons/pwa-192.svg",
    badge: "/icons/pwa-192.svg",
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/staff/lecturer/announcements";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
