"use client";

import { ChevronUp, Download, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { registerPortalServiceWorker } from "@/src/lib/push-notifications";

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

function supportsSecurePwaContext() {
  if (typeof window === "undefined") return false;

  if (window.isSecureContext) return true;

  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

export function PortalPwaInstall({ portal }: { portal: "student" | "staff" }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsInstalled(isStandaloneDisplayMode());
    setIsBrowserSupported("serviceWorker" in navigator && supportsSecurePwaContext());

    registerPortalServiceWorker().catch(() => undefined);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setIsOpen(true);
    };

    const onInstalled = () => {
      setInstallEvent(null);
      setIsInstalled(true);
      setIsOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (isInstalled) return;
    if (!isBrowserSupported) return;
    if (installEvent) return;

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [installEvent, isBrowserSupported, isInstalled]);

  const showIosInstructions = isIosBrowser() && !isInstalled;

  const copy = useMemo(
    () =>
      portal === "student"
        ? {
            short: "Student app",
            title: "Install CampusFlow Student",
            description:
              "Add the student portal to your device for faster sign-in, attendance, and announcements.",
          }
        : {
            short: "Staff app",
            title: "Install CampusFlow Staff",
            description:
              "Add the staff portal to your device for faster access to attendance, messages, and teaching tools.",
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
        setIsOpen(true);
      }
    } finally {
      setIsInstalling(false);
      setInstallEvent(null);
    }
  }

  if (isInstalled || !isBrowserSupported) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="pointer-events-auto fixed bottom-4 right-4 z-[9999] inline-flex items-center gap-2 rounded-full bg-[#255ac8] px-4 py-3 text-sm font-semibold text-white shadow-[0_24px_54px_rgba(37,90,200,0.22)] transition hover:bg-[#1d4eb1]"
        style={{ touchAction: "manipulation" }}
      >
        <Download className="h-4 w-4" />
        Install app
      </button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[9999] sm:inset-x-auto sm:right-5 sm:w-[22rem]">
      <div
        className="pointer-events-auto rounded-[24px] border border-[#d8e4fb] bg-white p-4 shadow-[0_24px_54px_rgba(37,90,200,0.18)]"
        style={{ touchAction: "manipulation" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef3ff] text-[#255ac8]">
              {showIosInstructions ? <Smartphone className="h-5 w-5" /> : <Download className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#243257]">{copy.title}</p>
              <p className="mt-1 text-sm leading-6 text-[#5f6b86]">{copy.description}</p>
              <p className="mt-2 text-xs leading-5 text-[#7a88a5]">
                {showIosInstructions
                  ? "On iPhone or iPad, open Share and choose Add to Home Screen."
                  : installEvent
                    ? "Tap install to launch the browser's app installation prompt."
                    : "If your browser does not show a native popup yet, use the browser menu and choose Install app or Add to Home Screen."}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Collapse install prompt"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1.5 text-[#7a88a5] transition hover:bg-[#f4f7ff] hover:text-[#243257]"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {!showIosInstructions ? (
            <button
              type="button"
              onClick={handleInstall}
              disabled={isInstalling || !installEvent}
              className="inline-flex items-center justify-center rounded-full bg-[#255ac8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4eb1] disabled:cursor-not-allowed disabled:bg-[#90aee7]"
            >
              {isInstalling ? "Preparing..." : installEvent ? `Install ${copy.short}` : "Open browser install menu"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center justify-center rounded-full border border-[#d8e4fb] px-4 py-2.5 text-sm font-semibold text-[#4e5e80] transition hover:bg-[#f7f9ff]"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
