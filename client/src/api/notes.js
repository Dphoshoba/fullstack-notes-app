import { apiRequest } from "./http.js";

export async function fetchNotes() {
  const data = await apiRequest("/api/notes?limit=50");
  return data.data;
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
