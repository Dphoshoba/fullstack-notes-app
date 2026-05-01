import { API_BASE_URL } from "../config.js";

const TOKEN_KEY = "notes_api_access_token";
export const AUTH_EXPIRED_EVENT = "notes_api_auth_expired";
let refreshPromise = null;

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

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include"
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload.accessToken) {
          throw new Error("Unable to refresh session");
        }

        tokenStorage.set(payload.accessToken);
        return payload.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function createRequestHeaders(options, token) {
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof window.FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function sendRequest(path, options, token) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: createRequestHeaders(options, token),
    credentials: "include"
  });
}

export async function apiRequest(path, options = {}) {
  const isAuthEndpoint =
    path === "/api/auth/login" || path === "/api/auth/register" || path === "/api/auth/refresh";
  let token = tokenStorage.get();
  let response = await sendRequest(path, options, token);

  if (response.status === 401 && token && !isAuthEndpoint) {
    try {
      token = await refreshAccessToken();
      response = await sendRequest(path, options, token);
    } catch {
      tokenStorage.clear();
      window.dispatchEvent(new window.CustomEvent(AUTH_EXPIRED_EVENT));
    }
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const isExpiredSession = response.status === 401 && !isAuthEndpoint;

    if (isExpiredSession) {
      tokenStorage.clear();
      window.dispatchEvent(new window.CustomEvent(AUTH_EXPIRED_EVENT));
    }

    const message = isExpiredSession ? "Please log in again." : payload.message || "Something went wrong";
    const error = new Error(message);
    error.status = response.status;
    error.details = payload.details;
    error.code = isExpiredSession ? "AUTH_EXPIRED" : undefined;
    throw error;
  }

  return payload;
}
