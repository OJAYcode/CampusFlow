"use client";

import { useEffect } from "react";

import { PwaInstallPrompt } from "@/src/components/pwa/pwa-install-prompt";
import { useAuthStore } from "@/src/store/auth-store";
import { registerPortalServiceWorker, syncPushSubscription } from "@/src/lib/push-notifications";

export function PwaBootstrap({ portal }: { portal: "student" | "staff" }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    registerPortalServiceWorker().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (portal === "student" && role !== "student") return;
    if (portal === "staff" && role !== "lecturer") return;
    if (typeof window === "undefined" || Notification.permission !== "granted") return;

    syncPushSubscription(portal).catch(() => undefined);
  }, [isAuthenticated, portal, role]);

  return <PwaInstallPrompt portal={portal} />;
}
