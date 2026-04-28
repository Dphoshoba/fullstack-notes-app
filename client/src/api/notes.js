import { apiRequest } from "./http.js";

export async function fetchNotes({
  search = "",
  page = 1,
  limit = 12,
  category = "",
  starred = "",
  scope = "all"
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
