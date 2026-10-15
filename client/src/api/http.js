import { API_BASE_URL } from "../config.js";

const TOKEN_KEY = "notes_api_access_token";
export const AUTH_EXPIRED_EVENT = "notes_api_auth_expired";
let refreshPromise = null;
let authExpired = false;

export const tokenStorage = {
  get() {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token) {
    authExpired = false;
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  }
};

function isAuthEndpoint(path) {
  return (
    path === "/api/auth/login" ||
    path === "/api/auth/logout" ||
    path === "/api/auth/register" ||
    path === "/api/auth/refresh"
  );
}

function createAuthExpiredError() {
  const error = new Error("Please log in again.");
  error.status = 401;
  error.code = "AUTH_EXPIRED";
  return error;
}

function createConnectionError() {
  const error = new Error("Connection failed. Check your internet connection and try again.");
  error.code = "NETWORK_ERROR";
  return error;
}

function expireSession() {
  tokenStorage.clear();

  if (!authExpired) {
    authExpired = true;
    window.dispatchEvent(new window.CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

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
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: createRequestHeaders(options, token),
      credentials: "include"
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw createConnectionError();
    }

    throw error;
  }
}

export async function apiRequest(path, options = {}) {
  const authEndpoint = isAuthEndpoint(path);

  if (authExpired && !authEndpoint) {
    throw createAuthExpiredError();
  }

  let token = tokenStorage.get();
  let response = await sendRequest(path, options, token);

  if (response.status === 401 && token && !authEndpoint) {
    try {
      token = await refreshAccessToken();
      response = await sendRequest(path, options, token);
    } catch {
      expireSession();
      throw createAuthExpiredError();
    }
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const isExpiredSession = response.status === 401 && !authEndpoint;

    if (isExpiredSession) {
      expireSession();
    }

    const detailMessage = Array.isArray(payload.details)
      ? payload.details.map((detail) => detail.message).filter(Boolean).join(" ")
      : "";
    const message = isExpiredSession
      ? "Please log in again."
      : [payload.message || "Something went wrong", detailMessage].filter(Boolean).join(": ");
    const error = new Error(message);
    error.status = response.status;
    error.details = payload.details;
    error.code = isExpiredSession ? "AUTH_EXPIRED" : undefined;
    throw error;
  }

  return payload;
}
