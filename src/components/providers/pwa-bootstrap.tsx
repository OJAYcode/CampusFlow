"use client";

import { useEffect, useState } from "react";

export function PwaBootstrap() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Register service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.debug("Service Worker registration failed:", err);
      });
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Note: The actual install button is provided by the browser in the address bar
  // This component just ensures the service worker and manifest are properly set up
  return null;
}
