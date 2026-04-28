import { apiRequest } from "./http.js";

export async function fetchUsers() {
  const data = await apiRequest("/api/users");
  return data.data;
}

export async function fetchUsage() {
  const data = await apiRequest("/api/users/usage");
  return data.data;
}

export async function fetchUserSettings() {
  const data = await apiRequest("/api/users/settings");
  return data.data;
}

export async function updateUserSettings(input) {
  const data = await apiRequest("/api/users/settings", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return data.data;
}

export async function updateMyProfile(input) {
  const data = await apiRequest("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return data.data;
}

export async function updateUserRole(id, role) {
  const data = await apiRequest(`/api/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role })
  });
  return data.data;
}
