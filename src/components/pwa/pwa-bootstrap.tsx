"use client";

import { motion } from "framer-motion";
import { Download, RotateCcw, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)")?.matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PwaBootstrap() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [serviceWorkerSupported, setServiceWorkerSupported] = useState(false);

  const canShowInstall = useMemo(() => Boolean(installPrompt) && !installed && !isStandaloneDisplayMode(), [installPrompt, installed]);

  useEffect(() => {
    setInstalled(isStandaloneDisplayMode());

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setServiceWorkerSupported(false);
      return;
    }

    setServiceWorkerSupported(true);

    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => {
        if (!cancelled) setServiceWorkerReady(true);
      })
      .catch(() => {
        if (!cancelled) setServiceWorkerReady(false);
      });

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  if (!serviceWorkerSupported) return null;
  if (!canShowInstall && serviceWorkerReady) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="fixed bottom-4 right-4 z-50 max-w-xs"
    >
      <div className="rounded-2xl border border-[#d6e0f1] bg-white/95 p-3 shadow-[0_18px_44px_rgba(47,50,125,0.12)] backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5fb] text-[#255ac8]">
            {serviceWorkerReady ? <Smartphone className="h-5 w-5" /> : <RotateCcw className="h-5 w-5 animate-spin" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#202c4b]">Install CampusFlow</p>
            <p className="mt-1 text-xs leading-5 text-[#66708a]">
              Add the portal to your device for quicker access and a smoother app-like experience.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstall}
            disabled={!installPrompt}
            className="inline-flex items-center gap-2 rounded-full bg-[#255ac8] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1f4ea7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Install
          </button>
          <span className="text-[11px] font-medium text-[#8090b0]">{installed ? "Installed" : serviceWorkerReady ? "Ready" : "Setting up…"}</span>
        </div>
      </div>
    </motion.div>
  );
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void> | void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
