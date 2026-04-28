import { apiRequest } from "./http.js";

export async function createWorkspace(input) {
  const data = await apiRequest("/api/workspaces", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return data.data;
}

export async function fetchMyWorkspace() {
  const data = await apiRequest("/api/workspaces/me");
  return data.data;
}

export async function fetchWorkspaceMembers() {
  const data = await apiRequest("/api/workspaces/members");
  return data.data;
}

export async function addWorkspaceMember(input) {
  const data = await apiRequest("/api/workspaces/members", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return data.data;
}

export async function createWorkspaceInvite(input) {
  const data = await apiRequest("/api/workspaces/invites", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return data.data;
}

export async function fetchWorkspaceInvite(token) {
  const data = await apiRequest(`/api/workspaces/invites/${token}`);
  return data.data;
}

export async function acceptWorkspaceInvite(token) {
  const data = await apiRequest(`/api/workspaces/invites/${token}/accept`, {
    method: "POST",
    body: JSON.stringify({})
  });
  return data.data;
}
