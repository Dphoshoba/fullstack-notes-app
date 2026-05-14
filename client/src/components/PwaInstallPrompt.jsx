import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const INSTALL_DISMISSED_KEY = "notes_api_pwa_install_dismissed";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(INSTALL_DISMISSED_KEY) === "true") {
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

  if (!visible || !deferredPrompt) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    setVisible(false);
    setDeferredPrompt(null);
  };

  const install = async () => {
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  return (
    <div className="safe-bottom fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-lg">
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-lg shadow-slate-950/10">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950">Install Notes Workspace</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Add the AI Business Notes Workspace to your home screen for faster access and an app-like
            experience.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={install}
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Install app
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
