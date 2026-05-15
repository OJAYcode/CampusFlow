"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    // Prevent multiple registrations
    let registered = false;

    // Register service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator && !registered) {
      registered = true;
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("Service Worker registered:", registration);
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

  return null;
}
