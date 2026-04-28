import { apiRequest } from "./http.js";

export async function createCheckoutSession() {
  const data = await apiRequest("/api/billing/create-checkout-session", {
    method: "POST",
    body: JSON.stringify({})
  });
  return data.data;
}

export async function fetchBillingStatus() {
  const data = await apiRequest("/api/billing/status");
  return data.data;
}
