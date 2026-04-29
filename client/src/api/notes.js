import { apiRequest, tokenStorage } from "./http.js";
import { API_BASE_URL } from "../config.js";

export async function fetchNotes({
  search = "",
  page = 1,
  limit = 12,
  category = "",
  starred = "",
  scope = "all",
  pinned = "",
  thisWeek = ""
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (category.trim()) {
    params.set("category", category.trim());
  }

  if (starred !== "") {
    params.set("starred", String(starred));
  }

  if (pinned !== "") {
    params.set("pinned", String(pinned));
  }

  if (thisWeek !== "") {
    params.set("thisWeek", String(thisWeek));
  }

  if (scope) {
    params.set("scope", scope);
  }

  const data = await apiRequest(`/api/notes?${params.toString()}`);
  return {
    notes: data.data,
    pagination: data.pagination
  };
}

export async function createNote(input) {
  const data = await apiRequest("/api/notes", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return data.data;
}

export async function deleteNote(id) {
  await apiRequest(`/api/notes/${id}`, {
    method: "DELETE"
  });
}

export async function updateNote(id, input) {
  const data = await apiRequest(`/api/notes/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
  return data.data;
}

export async function fetchComments(noteId) {
  const data = await apiRequest(`/api/notes/${noteId}/comments`);
  return data.data;
}

export async function createComment(noteId, input) {
  const data = await apiRequest(`/api/notes/${noteId}/comments`, {
    method: "POST",
    body: JSON.stringify(input)
  });
  return data.data;
}

export async function updateComment(id, input) {
  const data = await apiRequest(`/api/comments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return data.data;
}

export async function deleteComment(id) {
  await apiRequest(`/api/comments/${id}`, {
    method: "DELETE"
  });
}

export async function fetchAttachments(noteId) {
  const data = await apiRequest(`/api/notes/${noteId}/attachments`);
  return data.data;
}

export async function uploadAttachment(noteId, file) {
  const formData = new window.FormData();
  formData.append("file", file);

  const data = await apiRequest(`/api/notes/${noteId}/attachments`, {
    method: "POST",
    body: formData
  });
  return data.data;
}

export async function deleteAttachment(id) {
  await apiRequest(`/api/attachments/${id}`, {
    method: "DELETE"
  });
}

export function getAttachmentUrl(url) {
  return `${API_BASE_URL}${url}`;
}

export async function downloadAttachmentFile(attachment) {
  const headers = new Headers();
  const token = tokenStorage.get();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(getAttachmentUrl(attachment.url), {
    headers,
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Attachment could not be downloaded");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = attachment.originalName;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
