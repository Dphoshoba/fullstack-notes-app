import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

import { applyPwaUpdate, checkForPwaUpdate, PWA_UPDATE_AVAILABLE_EVENT } from "../pwa/registerPwa.js";

const UPDATE_DISMISSED_KEY = "notes_api_pwa_update_dismissed_at";
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

export function PwaUpdatePrompt() {
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const showUpdatePrompt = () => {
      const dismissedAt = Number(localStorage.getItem(UPDATE_DISMISSED_KEY) || 0);
      const dismissedRecently = Date.now() - dismissedAt < 10 * 60 * 1000;

      if (!dismissedRecently) {
        setVisible(true);
      }
    };

    window.addEventListener(PWA_UPDATE_AVAILABLE_EVENT, showUpdatePrompt);
    const intervalId = window.setInterval(() => {
      checkForPwaUpdate();
    }, UPDATE_CHECK_INTERVAL_MS);

    window.addEventListener("focus", checkForPwaUpdate);
    window.addEventListener("online", checkForPwaUpdate);

    return () => {
      window.removeEventListener(PWA_UPDATE_AVAILABLE_EVENT, showUpdatePrompt);
      window.removeEventListener("focus", checkForPwaUpdate);
      window.removeEventListener("online", checkForPwaUpdate);
      window.clearInterval(intervalId);
    };
  }, []);

  if (!visible) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(UPDATE_DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  };

  const updateNow = () => {
    setUpdating(true);
    applyPwaUpdate();
  };

  return (
    <div className="safe-bottom fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-lg">
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-lg shadow-slate-950/10 dark:border-emerald-800 dark:bg-slate-900 dark:shadow-black/30">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
          <RefreshCw className={`h-5 w-5 ${updating ? "animate-spin" : ""}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Update ready</p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            A fresh version of Notes Workspace is ready. Update now to use the latest fixes.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={updateNow}
              disabled={updating}
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {updating ? "Updating..." : "Update now"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              disabled={updating}
              className="inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Later
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          disabled={updating}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Dismiss update prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
