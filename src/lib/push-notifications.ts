// PWA/Push notification features have been removed from this project
// These functions are kept as stubs to prevent breaking imports

import { apiClient } from "@/src/api/client";
import { getStoredSession } from "@/src/utils/session-storage";

export function isPortalPwaRuntimeEnabled() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && !!window.location;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPortalServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (e) {
    return null;
  }
}

export async function syncPushSubscription(portal: "student" | "staff") {
  // Fetch server public key
  try {
    const res = await fetch(`${apiClient.defaults.baseURL.replace(/\/api\/v1$/, '')}/api/v1/notifications/push/public-config`);
    const cfg = await res.json();
    if (!cfg?.data?.enabled) return { enabled: false, reason: 'push_not_configured' };
    return { enabled: true, publicKey: cfg.data.publicKey };
  } catch (e) {
    return { enabled: false, reason: 'fetch_failed' };
  }
}

export async function requestPushNotifications(portal: "student" | "staff") {
  if (typeof window === "undefined") return { enabled: false, reason: 'not_supported' };

  if (!('Notification' in window)) return { enabled: false, reason: 'not_supported' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { enabled: false, reason: 'permission_denied' };

  // try web push
  try {
    const cfg = await syncPushSubscription(portal);
    if (!cfg.enabled || !cfg.publicKey) return { enabled: true, reason: 'push_not_configured' };

    const registration = await registerPortalServiceWorker();
    if (!registration) return { enabled: true, reason: 'sw_registration_failed' };

    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(cfg.publicKey),
    });

    // post subscription to server
    const keys = sub.toJSON();
    const body = {
      endpoint: keys.endpoint,
      keys: keys.keys,
      portal,
    };

    const result = await apiClient.post('/notifications/push/subscriptions', body, { withCredentials: true });

    // also request setting SSE cookie for EventSource auth (same-origin cookie)
    try {
      await apiClient.post('/notifications/sse-cookie', {}, { withCredentials: true });
    } catch (e) {
      // ignore
    }

    return { enabled: true };
  } catch (e) {
    return { enabled: true, reason: 'push_failed' };
  }
}
