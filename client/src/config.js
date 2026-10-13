import { Capacitor } from "@capacitor/core";

const nativeDevApiUrl = Capacitor.getPlatform() === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (Capacitor.isNativePlatform() ? nativeDevApiUrl : "http://localhost:4000");
