import { useEffect, useState } from "react";
import { Download, Share2, Smartphone, X } from "lucide-react";
import { Capacitor } from "@capacitor/core";

const INSTALL_DISMISSED_KEY = "notes_api_pwa_install_dismissed";

const isStandaloneApp = () =>
  window.matchMedia?.("(display-mode: standalone)")?.matches ||
  window.navigator.standalone === true;

const isIosDevice = () => {
  const platform = window.navigator.platform || "";
  const userAgent = window.navigator.userAgent || "";
  const isClassicIos = /iPad|iPhone|iPod/.test(userAgent);
  const isModernIpad = platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return isClassicIos || isModernIpad;
};

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [iosPrompt, setIosPrompt] = useState(false);

  useEffect(() => {
    if (
      Capacitor.isNativePlatform() ||
      isStandaloneApp() ||
      localStorage.getItem(INSTALL_DISMISSED_KEY) === "true"
    ) {
      return undefined;
    }

    if (isIosDevice()) {
      setIosPrompt(true);
      setVisible(true);
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

    const standaloneWatcher = window.matchMedia?.("(display-mode: standalone)");
    const handleStandaloneChange = () => {
      if (isStandaloneApp()) {
        setVisible(false);
        setDeferredPrompt(null);
        setIosPrompt(false);
      }
    };

    standaloneWatcher?.addEventListener?.("change", handleStandaloneChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      standaloneWatcher?.removeEventListener?.("change", handleStandaloneChange);
    };
  }, []);

  if (!visible || (!deferredPrompt && !iosPrompt)) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    setVisible(false);
    setDeferredPrompt(null);
    setIosPrompt(false);
  };

  const install = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  return (
    <div className="safe-bottom fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-lg">
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-lg shadow-slate-950/10 dark:border-emerald-800 dark:bg-slate-900 dark:shadow-black/30">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
          {iosPrompt ? <Smartphone className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Install Notes Workspace</p>
          {iosPrompt ? (
            <div className="mt-1 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <p>Add this app to your iPhone or iPad home screen for faster access.</p>
              <ol className="space-y-1">
                <li className="flex gap-2">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">1.</span>
                  <span className="inline-flex items-center gap-1">
                    Tap <Share2 className="h-4 w-4" aria-hidden="true" /> Share in Safari.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">2.</span>
                  <span>Choose Add to Home Screen.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">3.</span>
                  <span>Tap Add, then open Notes Workspace from your home screen.</span>
                </li>
              </ol>
            </div>
          ) : (
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Add the AI Business Notes Workspace to your home screen for faster access and an app-like
              experience.
            </p>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {!iosPrompt ? (
              <button
                type="button"
                onClick={install}
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Install app
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
