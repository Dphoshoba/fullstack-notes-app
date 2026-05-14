/* global navigator, console */
import { registerSW } from "virtual:pwa-register";

let updateServiceWorker;

export function registerPwa() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  updateServiceWorker = registerSW({
    immediate: true,
    onOfflineReady() {
      console.info("[pwa] App shell is ready for offline use.");
    },
    onRegistered(registration) {
      if (!registration) {
        return;
      }

      console.info("[pwa] Service worker registered.");
    },
    onRegisterError(error) {
      console.error("[pwa] Service worker registration failed.", error);
    }
  });
}

export function applyPwaUpdate() {
  updateServiceWorker?.(true);
}
