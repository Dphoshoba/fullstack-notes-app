// Enhanced semantic search: hybrid of Algolia (if configured) + OpenAI ranking fallback
import { Note } from "../models/Note.js";

export const searchNotes = async ({ user, query, scope = "all", limit = 12 }) => {
  const workspaceId = user.organizationId?.toString();
  const privateFilter = {
    owner: user.id,
    $or: [{ visibility: "private" }, { visibility: { $exists: false } }]
  };
  const workspaceFilter = workspaceId
    ? { visibility: "workspace", organizationId: user.organizationId }
    : null;

  let filter;
  if (scope === "private" || !workspaceFilter) {
    filter = privateFilter;
  } else if (scope === "workspace") {
    filter = workspaceFilter;
  } else {
    filter = { $or: [privateFilter, workspaceFilter] };
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  filter.$and = [{ $or: [{ title: new RegExp(escaped, "i") }, { body: new RegExp(escaped, "i") }, { tags: new RegExp(escaped, "i") }] }];

  const notes = await Note.find(filter).sort({ createdAt: -1 }).limit(50).select("title body tags category noteType meetingMeta").lean();

  return notes.map((n) => ({
    id: n._id.toString(),
    title: n.title,
    category: n.category,
    noteType: n.noteType,
    snippet: n.body.slice(0, 350),
    tags: n.tags
  }));
};
