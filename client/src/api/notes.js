import { apiRequest } from "./http.js";

export async function fetchNotes({ search = "", page = 1, limit = 12, category = "" } = {}) {
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
