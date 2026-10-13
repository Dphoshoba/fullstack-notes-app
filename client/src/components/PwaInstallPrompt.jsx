import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";

const INSTALL_DISMISSED_KEY = "notes_api_pwa_install_dismissed";

function isIosDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const userAgent = navigator.userAgent || "";
  const isIpadOS =
    navigator.maxTouchPoints &&
    navigator.maxTouchPoints > 2 &&
    /Macintosh/.test(userAgent);
  return /iPhone|iPod|iPad/.test(userAgent) || isIpadOS;
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) {
      return undefined;
    }

    if (localStorage.getItem(INSTALL_DISMISSED_KEY) === "true") {
      return undefined;
    }

    const ios = isIosDevice();
    setIsIos(ios);

    if (ios) {
      setVisible(true);
      return undefined;
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setVisible(false);
      localStorage.removeItem(INSTALL_DISMISSED_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!visible) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    setVisible(false);
    setDeferredPrompt(null);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  return (
    <div className="safe-bottom fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-lg">
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-lg shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-800">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-900">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            Install Notes Workspace
          </p>
          {isIos ? (
            <div className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <p>To install on iOS / iPadOS:</p>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-1.5">
                  1. Tap the <Share className="inline h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> <strong>Share</strong> button in Safari.
                </li>
                <li className="flex items-center gap-1.5">
                  2. Scroll down and tap <PlusSquare className="inline h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> <strong>Add to Home Screen</strong>.
                </li>
              </ol>
            </div>
          ) : (
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Add the AI Business Notes Workspace to your home screen for faster access and an app-like experience.
            </p>
          )}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {!isIos && deferredPrompt && (
              <button
                type="button"
                onClick={install}
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Install app
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {isIos ? "Got it" : "Not now"}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

