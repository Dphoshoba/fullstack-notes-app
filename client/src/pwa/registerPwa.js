
import { registerSW } from "virtual:pwa-register";

export const PWA_UPDATE_AVAILABLE_EVENT = "notes_api_pwa_update_available";

let updateServiceWorker;
let serviceWorkerRegistration;

const notifyUpdateAvailable = () => {
  window.dispatchEvent(new window.CustomEvent(PWA_UPDATE_AVAILABLE_EVENT));
};

export function registerPwa() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  updateServiceWorker = registerSW({
    immediate: true,
    onOfflineReady() {
      console.info("[pwa] App shell is ready for offline use.");
    },
    onNeedRefresh() {
      notifyUpdateAvailable();
    },
    onRegistered(registration) {
      if (!registration) {
        return;
      }

      serviceWorkerRegistration = registration;
      console.info("[pwa] Service worker registered.");
      checkForPwaUpdate();
    },
    onRegisterError(error) {
      console.error("[pwa] Service worker registration failed.", error);
    }
  });
}

export function applyPwaUpdate() {
  updateServiceWorker?.(true);
}

export function checkForPwaUpdate() {
  serviceWorkerRegistration?.update?.();
}
