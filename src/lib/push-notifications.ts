// PWA/Push notification features have been removed from this project
// These functions are kept as stubs to prevent breaking imports

export function isPortalPwaRuntimeEnabled() {
  return false;
}

export async function registerPortalServiceWorker() {
  return null;
}

export async function syncPushSubscription(portal: "student" | "staff") {
  return { enabled: false, reason: "pwa_disabled" };
}

export async function requestPushNotifications(portal: "student" | "staff") {
  return { enabled: false, reason: "pwa_disabled" };
}
