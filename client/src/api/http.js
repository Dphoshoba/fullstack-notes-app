import { API_BASE_URL } from "../config.js";

const TOKEN_KEY = "notes_api_access_token";

export const tokenStorage = {
  get() {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = tokenStorage.get();

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof window.FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.message || "Something went wrong";
    const error = new Error(message);
    error.status = response.status;
    error.details = payload.details;
    throw error;
  }

  return payload;
}
