"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { ensurePushSubscription, registerPortalServiceWorker } from "@/src/lib/push-notifications";
import { getStoredSession } from "@/src/utils/session-storage";

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
}

export function PwaBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      void registerPortalServiceWorker()
        .then((registration) => {
          if (registration) {
            console.log("Service Worker registered:", registration);
          }
        })
        .catch((err) => {
          console.debug("Service Worker registration failed:", err);
        });
    }

    // Log install prompt events for debugging
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt fired - install button should appear");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const { accessToken } = getStoredSession();
    if (!accessToken) return;

    const portal = pathname.startsWith("/staff") ? "staff" : pathname.startsWith("/student") ? "student" : null;
    if (!portal) return;

    void ensurePushSubscription(portal).then((result) => {
      if (!result.enabled) {
        console.debug("Push subscription sync skipped:", result.reason);
      }
    });
  }, [pathname]);

  return null;
}
