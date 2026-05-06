const DEV_SW_RESET_SCRIPT = `
(() => {
  if (typeof window === "undefined") return;
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (!isLocalHost || !("serviceWorker" in navigator)) return;

  const marker = "campusflow-dev-sw-reset-v1";
  if (window.sessionStorage.getItem(marker) === "done") return;

  Promise.all([
    navigator.serviceWorker.getRegistrations(),
    "caches" in window ? window.caches.keys() : Promise.resolve([]),
  ])
    .then(async ([registrations, cacheKeys]) => {
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ("caches" in window) {
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      }

      const hadArtifacts = registrations.length > 0 || cacheKeys.length > 0;
      window.sessionStorage.setItem(marker, "done");

      if (hadArtifacts) {
        window.location.reload();
      }
    })
    .catch(() => {
      window.sessionStorage.setItem(marker, "done");
    });
})();
`;

export function DevServiceWorkerResetScript() {
  return <script dangerouslySetInnerHTML={{ __html: DEV_SW_RESET_SCRIPT }} suppressHydrationWarning />;
}
