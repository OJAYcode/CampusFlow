"use client";

/* eslint-disable simple-import-sort/imports */
import { useEffect } from "react";

import { PortalPwaInstall } from "@/src/components/pwa/portal-pwa-install";
import { syncPushSubscription } from "@/src/lib/push-notifications";
import { useAuthStore } from "@/src/store/auth-store";

export function PwaBootstrap({ portal }: { portal: "student" | "staff" }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (portal === "student" && role !== "student") return;
    if (portal === "staff" && role !== "lecturer") return;
    if (typeof window === "undefined" || Notification.permission !== "granted") return;

    syncPushSubscription(portal).catch(() => undefined);
  }, [isAuthenticated, portal, role]);

  return <PortalPwaInstall portal={portal} />;
}
