import { apiRequest } from "./http.js";

export async function fetchNotifications() {
  const payload = await apiRequest("/api/notifications");
  return payload.data;
}

export async function markNotificationRead(id) {
  const payload = await apiRequest(`/api/notifications/${id}/read`, {
    method: "PATCH"
  });
  return payload.data;
}
