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

export async function improveWriting(noteId) {
  const data = await apiRequest("/api/ai/improve-writing", {
    method: "POST",
    body: JSON.stringify({ noteId })
  });
  return data.data;
}

export async function extractTasks(noteId) {
  const data = await apiRequest("/api/ai/extract-tasks", {
    method: "POST",
    body: JSON.stringify({ noteId })
  });
  return data.data;
}

export async function createExecutiveSummary(noteId) {
  const data = await apiRequest("/api/ai/executive-summary", {
    method: "POST",
    body: JSON.stringify({ noteId })
  });
  return data.data;
}

export async function createFollowUpEmail(noteId) {
  const data = await apiRequest("/api/ai/follow-up-email", {
    method: "POST",
    body: JSON.stringify({ noteId })
  });
  return data.data;
}

export async function generateStudyNotes(noteId) {
  const data = await apiRequest("/api/ai/study-notes", {
    method: "POST",
    body: JSON.stringify({ noteId })
  });
  return data.data;
}

export async function convertToMeetingMinutes(noteId) {
  const data = await apiRequest("/api/ai/convert-to-meeting-minutes", {
    method: "POST",
    body: JSON.stringify({ noteId })
  });
  return data.data;
}

export async function extractActionItems(noteId) {
  const data = await apiRequest("/api/ai/extract-action-items", {
    method: "POST",
    body: JSON.stringify({ noteId })
  });
  return data.data;
}

export async function extractAttendeesAndDecisions(noteId) {
  const data = await apiRequest("/api/ai/extract-attendees-decisions", {
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

export async function getSmartSuggestions({ title, body, noteType }) {
  const data = await apiRequest("/api/ai/smart-suggestions", {
    method: "POST",
    body: JSON.stringify({ title, body, noteType })
  });
  return data.data;
}

export async function fetchInsightsDashboard() {
  const data = await apiRequest("/api/ai/insights-dashboard");
  return data.data;
}
