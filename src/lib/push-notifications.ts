import { apiClient } from "@/src/api/client";

export function isPortalPwaRuntimeEnabled() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && !!window.location;
}

type PortalType = "student" | "staff";

type PushResult = {
  enabled: boolean;
  reason?: string;
  publicKey?: string;
};

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
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (e) {
    return null;
  }
}

async function fetchPushPublicConfig(): Promise<PushResult> {
  try {
    const baseUrl = apiClient.defaults.baseURL ?? "";
    const origin = baseUrl ? baseUrl.replace(/\/api\/v1$/, "") : "";
    const res = await fetch(`${origin}/api/v1/notifications/push/public-config`);
    const cfg = await res.json();
    if (!cfg?.data?.enabled) return { enabled: false, reason: "push_not_configured" };
    return { enabled: true, publicKey: cfg.data.publicKey };
  } catch (e) {
    return { enabled: false, reason: "fetch_failed" };
  }
}

async function savePushSubscription(subscription: PushSubscription, portal: PortalType) {
  const keys = subscription.toJSON();
  await apiClient.post(
    "/notifications/push/subscriptions",
    {
      endpoint: keys.endpoint,
      keys: keys.keys,
      portal,
    },
    { withCredentials: true },
  );
}

async function ensurePushSubscriptionInternal(portal: PortalType, requestPermission: boolean): Promise<PushResult> {
  if (typeof window === "undefined") return { enabled: false, reason: "not_supported" };

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { enabled: false, reason: "not_supported" };
  }

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : requestPermission
        ? await Notification.requestPermission()
        : Notification.permission;

  if (permission !== "granted") {
    return { enabled: false, reason: permission === "denied" ? "permission_denied" : "permission_required" };
  }

  const cfg = await fetchPushPublicConfig();
  if (!cfg.enabled || !cfg.publicKey) return { enabled: false, reason: cfg.reason || "push_not_configured" };

  const registration = await registerPortalServiceWorker();
  if (!registration) return { enabled: false, reason: "sw_registration_failed" };

  try {
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cfg.publicKey),
      });
    }

    await savePushSubscription(subscription, portal);

    // also request setting SSE cookie for EventSource auth (same-origin cookie)
    try {
      await apiClient.post("/notifications/sse-cookie", {}, { withCredentials: true });
    } catch (e) {
      // ignore
    }

    return { enabled: true };
  } catch (e) {
    return { enabled: false, reason: "push_failed" };
  }
}

export async function syncPushSubscription(_portal: PortalType) {
  return fetchPushPublicConfig();
}

export async function requestPushNotifications(portal: PortalType) {
  return ensurePushSubscriptionInternal(portal, true);
}

export async function ensurePushSubscription(portal: PortalType) {
  return ensurePushSubscriptionInternal(portal, false);
}
