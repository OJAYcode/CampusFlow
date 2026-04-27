"use client";

import { Download, Smartphone, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosBrowser() {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

function getDismissKey(portal: "student" | "staff") {
  return `campusflow:pwa-dismissed:${portal}`;
}

export function PwaInstallPrompt({ portal }: { portal: "student" | "staff" }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setDismissed(window.localStorage.getItem(getDismissKey(portal)) === "1");
    setIsInstalled(isStandaloneDisplayMode());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setDismissed(window.localStorage.getItem(getDismissKey(portal)) === "1");
    };

    const onInstalled = () => {
      setInstallEvent(null);
      setDismissed(true);
      setIsInstalled(true);
      window.localStorage.setItem(getDismissKey(portal), "1");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [portal]);

  const canInstall = Boolean(installEvent) && !dismissed && !isInstalled;
  const showIosHint = isIosBrowser() && !isInstalled && !dismissed;

  const copy = useMemo(
    () =>
      portal === "student"
        ? {
            title: "Install student app",
            body: "Add CampusFlow Student to your home screen for faster access and lecturer announcements.",
          }
        : {
            title: "Install staff app",
            body: "Add CampusFlow Staff to your device for quicker access to attendance, messages, and alerts.",
          },
    [portal],
  );

  async function handleInstall() {
    if (!installEvent) return;

    setIsInstalling(true);

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome !== "accepted") {
        setDismissed(true);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(getDismissKey(portal), "1");
        }
      }
    } finally {
      setIsInstalling(false);
      setInstallEvent(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(getDismissKey(portal), "1");
    }
  }

  if (!canInstall && !showIosHint) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[120] sm:inset-x-auto sm:right-5 sm:w-[22rem]">
      <div className="rounded-[24px] border border-[#d8e4fb] bg-white p-4 shadow-[0_24px_54px_rgba(37,90,200,0.18)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef3ff] text-[#255ac8]">
              {showIosHint ? <Smartphone className="h-5 w-5" /> : <Download className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#243257]">{copy.title}</p>
              <p className="mt-1 text-sm leading-6 text-[#5f6b86]">
                {showIosHint
                  ? `${copy.body} On iPhone or iPad, use Share > Add to Home Screen.`
                  : copy.body}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Dismiss install prompt"
            onClick={handleDismiss}
            className="rounded-full p-1.5 text-[#7a88a5] transition hover:bg-[#f4f7ff] hover:text-[#243257]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!showIosHint ? (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleInstall}
              disabled={isInstalling}
              className="inline-flex items-center justify-center rounded-full bg-[#255ac8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4eb1] disabled:cursor-not-allowed disabled:bg-[#90aee7]"
            >
              {isInstalling ? "Preparing..." : "Install app"}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center rounded-full border border-[#d8e4fb] px-4 py-2.5 text-sm font-semibold text-[#4e5e80] transition hover:bg-[#f7f9ff]"
            >
              Not now
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
