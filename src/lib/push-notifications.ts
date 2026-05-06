import { notificationApi } from "@/src/api/notifications";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; ++index) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function isLocalDevHost() {
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

export function isPortalPwaRuntimeEnabled() {
  if (typeof window === "undefined") return false;
  return !isLocalDevHost();
}

async function clearDevPortalServiceWorkers() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if (!("caches" in window)) return;

  const cacheKeys = await window.caches.keys();
  await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
}

export async function registerPortalServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  if (isLocalDevHost()) {
    await clearDevPortalServiceWorkers();
    return null;
  }

  const secureContext =
    window.isSecureContext || ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (!secureContext) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export async function syncPushSubscription(portal: "student" | "staff") {
  if (typeof window === "undefined") return { enabled: false, reason: "window unavailable" };
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { enabled: false, reason: "push unsupported" };
  }

  const registration = await registerPortalServiceWorker();
  if (!registration) return { enabled: false, reason: "service worker unavailable" };

  const config = await notificationApi.pushPublicConfig();
  if (!config.data.enabled || !config.data.publicKey) {
    return { enabled: false, reason: "push not configured" };
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription && Notification.permission === "granted") {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.data.publicKey),
    });
  }

  if (!subscription) {
    return { enabled: false, reason: "subscription unavailable" };
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { enabled: false, reason: "invalid subscription" };
  }

  await notificationApi.savePushSubscription({
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    portal,
  });

  return { enabled: true, endpoint: json.endpoint };
}

export async function requestPushNotifications(portal: "student" | "staff") {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { enabled: false, reason: "notifications unsupported" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { enabled: false, reason: "permission denied" };
  }

  return syncPushSubscription(portal);
}
