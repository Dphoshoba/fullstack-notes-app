import { apiRequest } from "./http.js";

export async function summarizeNote(noteId) {
  const data = await apiRequest("/api/ai/summarize-note", {
    method: "POST",
    body: JSON.stringify({ noteId })
  });
  return data.data;
}

export async function suggestTags(noteId) {
  const data = await apiRequest("/api/ai/suggest-tags", {
    method: "POST",
    body: JSON.stringify({ noteId })
  });
  return data.data;
}

export async function generateSmartInsights() {
  const data = await apiRequest("/api/ai/smart-insights", {
    method: "POST",
    body: JSON.stringify({})
  });
  return data.data;
}
