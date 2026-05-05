const CACHE_NAME = "campusflow-student-pwa-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "CampusFlow Student Portal";
  const options = {
    body: payload.body || "You have a new update.",
    icon: "/icons/pwa-192.png",
    badge: "/icons/pwa-192.png",
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/student/announcements";

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
