"use client";

import { ChevronUp, Download, Smartphone, X } from "lucide-react";
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

export function PwaInstallPrompt({ portal }: { portal: "student" | "staff" }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsInstalled(isStandaloneDisplayMode());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setIsCollapsed(false);
    };

    const onInstalled = () => {
      setInstallEvent(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [portal]);

  const canInstall = Boolean(installEvent) && !isInstalled;
  const showIosHint = isIosBrowser() && !isInstalled;

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

  const installHint = useMemo(() => {
    if (showIosHint) {
      return "Open Share and choose Add to Home Screen.";
    }

    if (canInstall) {
      return "Install it once for faster access and launcher shortcuts.";
    }

    return "If your browser does not show the install popup yet, open the browser menu and choose Install app or Add to Home Screen.";
  }, [canInstall, showIosHint]);

  async function handleInstall() {
    if (!installEvent) return;

    setIsInstalling(true);

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome !== "accepted") {
        setIsCollapsed(false);
      }
    } finally {
      setIsInstalling(false);
      setInstallEvent(null);
    }
  }

  if (isInstalled) return null;

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-4 right-4 z-[120] inline-flex items-center gap-2 rounded-full bg-[#255ac8] px-4 py-3 text-sm font-semibold text-white shadow-[0_24px_54px_rgba(37,90,200,0.22)] transition hover:bg-[#1d4eb1]"
      >
        <Download className="h-4 w-4" />
        Install app
      </button>
    );
  }

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
                {copy.body}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#7a88a5]">{installHint}</p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Collapse install prompt"
            onClick={() => setIsCollapsed(true)}
            className="rounded-full p-1.5 text-[#7a88a5] transition hover:bg-[#f4f7ff] hover:text-[#243257]"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>

        {!showIosHint ? (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={canInstall ? handleInstall : () => undefined}
              disabled={isInstalling || !canInstall}
              className="inline-flex items-center justify-center rounded-full bg-[#255ac8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4eb1] disabled:cursor-not-allowed disabled:bg-[#90aee7]"
            >
              {isInstalling ? "Preparing..." : "Install app"}
            </button>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="inline-flex items-center justify-center rounded-full border border-[#d8e4fb] px-4 py-2.5 text-sm font-semibold text-[#4e5e80] transition hover:bg-[#f7f9ff]"
            >
              Later
            </button>
          </div>
        ) : null}

        {showIosHint ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-[#60708f]">Safari requires manual install.</span>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="inline-flex items-center justify-center rounded-full border border-[#d8e4fb] px-4 py-2.5 text-sm font-semibold text-[#4e5e80] transition hover:bg-[#f7f9ff]"
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
