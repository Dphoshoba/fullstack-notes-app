import { API_BASE_URL } from "../config.js";
import { tokenStorage } from "./http.js";

const ANONYMOUS_ID_KEY = "notes_api_anonymous_id";

const eventTypeByName = {
  landing_page_view: "view",
  guide_view: "view",
  dashboard_view: "view",
  click_get_started: "click",
  click_login: "click",
  click_register: "click",
  click_pricing: "click",
  click_upgrade: "click",
  create_note: "action",
  use_ai_tool: "action",
  export_notes: "action"
};

const getAnonymousId = () => {
  let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);

  if (!anonymousId) {
    anonymousId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
  }

  return anonymousId;
};

export function trackEvent(eventName, metadata = {}) {
  const token = tokenStorage.get();
  const headers = new Headers({ "Content-Type": "application/json" });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  fetch(`${API_BASE_URL}/api/analytics/events`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      anonymousId: token ? "" : getAnonymousId(),
      eventName,
      eventType: eventTypeByName[eventName] || "custom",
      path: window.location.pathname,
      metadata
    })
  }).catch(() => {});
}

export async function fetchAnalyticsSummary() {
  const token = tokenStorage.get();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}/api/analytics/summary`, {
    headers,
    credentials: "include"
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Could not load analytics summary");
  }

  return payload.data;
}
