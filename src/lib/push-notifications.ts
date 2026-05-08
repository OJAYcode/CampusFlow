// PWA/Push notification features have been removed from this project
// These functions are kept as stubs to prevent breaking imports

export function isPortalPwaRuntimeEnabled() {
  return false;
}

export async function registerPortalServiceWorker() {
  // Service worker might be absent when PWA features are removed; try register if available.
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    // Attempt to register a service worker if one exists at /sw.js
    return await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    return null;
  }
}

export async function syncPushSubscription(portal: "student" | "staff") {
  // No server-side push sync implemented in this fallback.
  return { enabled: false, reason: "push_not_configured" };
}

export async function requestPushNotifications(portal: "student" | "staff") {
  if (typeof window === "undefined") return { enabled: false, reason: "not_supported" };

  if (!("Notification" in window)) {
    return { enabled: false, reason: "not_supported" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { enabled: false, reason: "permission_denied" };

    // Try to register a service worker if available (best-effort).
    try {
      await registerPortalServiceWorker();
    } catch (e) {
      // ignore
    }

    return { enabled: true };
  } catch (err) {
    return { enabled: false, reason: "request_failed" };
  }
}
