import { apiRequest, tokenStorage } from "./http.js";

export async function registerUser(input) {
  const data = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
  tokenStorage.set(data.accessToken);
  return data.user;
}

export async function loginUser(input) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
  tokenStorage.set(data.accessToken);
  return data.user;
}

export async function fetchCurrentUser() {
  const data = await apiRequest("/api/auth/me");
  return data.user;
}

export async function logoutUser() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } finally {
    tokenStorage.clear();
  }
}
