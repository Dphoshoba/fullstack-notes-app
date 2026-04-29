import { StatusCodes } from "http-status-codes";

import { Note } from "../models/Note.js";
import { ApiError } from "../utils/ApiError.js";

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "because",
  "been",
  "before",
  "being",
  "between",
  "from",
  "have",
  "into",
  "just",
  "more",
  "note",
  "notes",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "this",
  "with",
  "your"
]);

const normalizeWords = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));

const summarizeBody = (body) => {
  const sentences = String(body || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length) {
    return sentences.slice(0, 2).join(" ").slice(0, 260);
  }

  return String(body || "").trim().slice(0, 260);
};

const keywordTags = (note) => {
  const words = normalizeWords(`${note.title || ""} ${note.body || ""}`);
  const counts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([word]) => word);
};

const notePayload = (note) => ({
  id: note.id,
  title: note.title,
  category: note.category || "General"
});

const noteLookup = async (req) => {
  const note = await Note.findOne({ _id: req.body.noteId, owner: req.user.id });

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

  return note;
};

const linesFromBody = (body) =>
  String(body || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

const parseNamedList = (body, names) => {
  const lines = linesFromBody(body);
  const results = [];
  let collecting = false;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    const isRequestedHeading = names.some((name) => lowerLine.startsWith(`${name}:`) || lowerLine === name);
    const isOtherHeading = /^[a-z][a-z\s&]+:$/i.test(line) && !isRequestedHeading;

    if (isRequestedHeading) {
      const inlineValue = line.split(":").slice(1).join(":").trim();
      if (inlineValue) {
        results.push(...inlineValue.split(",").map((item) => item.trim()).filter(Boolean));
      }
      collecting = true;
      continue;
    }

    if (collecting && isOtherHeading) {
      collecting = false;
    }

    if (collecting) {
      results.push(line);
    }
  }

  return [...new Set(results)];
};

const inferAttendees = (note) => {
  const existing = note.meetingMeta?.attendees || [];
  const parsed = parseNamedList(note.body, ["attendees", "participants", "present"]);

  return [...new Set([...existing, ...parsed])].filter(Boolean);
};

const inferDecisions = (body) => {
  const parsed = parseNamedList(body, ["decisions", "decision"]);

  if (parsed.length) {
    return parsed;
  }

  return linesFromBody(body).filter((line) => /\b(decided|approved|agreed)\b/i.test(line)).slice(0, 6);
};

const inferActionItems = (body) => {
  const parsed = parseNamedList(body, ["action items", "actions", "tasks"]);
  const fallback = linesFromBody(body).filter((line) => /\b(todo|action|follow up|follow-up|owner|due)\b/i.test(line));
  const items = (parsed.length ? parsed : fallback).slice(0, 8);

  return items.map((text) => ({
    text,
    owner: "",
    dueDate: "",
    status: "open"
  }));
};

const buildMeetingMinutes = (note) => {
  const decisions = inferDecisions(note.body);
  const actionItems = inferActionItems(note.body);

  return [
    `# ${note.title}`,
    "",
    "## Agenda",
    note.meetingMeta?.agenda || summarizeBody(note.body) || "Review discussion topics.",
    "",
    "## Discussion",
    note.body,
    "",
    "## Decisions",
    decisions.length ? decisions.map((decision) => `- ${decision}`).join("\n") : "- No decisions captured yet.",
    "",
    "## Action items",
    actionItems.length ? actionItems.map((item) => `- ${item.text}`).join("\n") : "- No action items captured yet.",
    "",
    "## Next steps",
    note.meetingMeta?.followUpDate ? `Follow up on ${note.meetingMeta.followUpDate.toISOString().slice(0, 10)}.` : "Confirm next steps with attendees."
  ].join("\n");
};

export const summarizeNote = async (req, res) => {
  const note = await noteLookup(req);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "summary",
      provider: "local-placeholder",
      note: notePayload(note),
      summary: summarizeBody(note.body),
      replaceableWithAi: true
    }
  });
};

export const suggestTags = async (req, res) => {
  const note = await noteLookup(req);

  const existingTags = new Set((note.tags || []).map((tag) => tag.toLowerCase()));
  const suggestedTags = keywordTags(note).filter((tag) => !existingTags.has(tag));

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "tag-suggestions",
      provider: "local-placeholder",
      note: notePayload(note),
      suggestedTags,
      replaceableWithAi: true
    }
  });
};

export const convertToMeetingMinutes = async (req, res) => {
  const note = await noteLookup(req);
  const attendees = inferAttendees(note);
  const decisions = inferDecisions(note.body);
  const actionItems = inferActionItems(note.body);
  const cleanedBody = buildMeetingMinutes(note);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "meeting-minutes",
      provider: "local-placeholder",
      note: notePayload(note),
      cleanedBody,
      meetingMeta: {
        meetingDate: note.meetingMeta?.meetingDate || null,
        attendees,
        agenda: note.meetingMeta?.agenda || summarizeBody(note.body),
        decisions,
        actionItems,
        followUpDate: note.meetingMeta?.followUpDate || null,
        sourceType: "ai-local"
      },
      replaceableWithAi: true
    }
  });
};

export const extractActionItems = async (req, res) => {
  const note = await noteLookup(req);
  const actionItems = inferActionItems(note.body);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "meeting-action-items",
      provider: "local-placeholder",
      note: notePayload(note),
      cleanedBody: actionItems.length
        ? actionItems.map((item) => `- ${item.text}`).join("\n")
        : "No action items captured yet.",
      meetingMeta: {
        actionItems,
        sourceType: "ai-local"
      },
      replaceableWithAi: true
    }
  });
};

export const extractAttendeesAndDecisions = async (req, res) => {
  const note = await noteLookup(req);
  const attendees = inferAttendees(note);
  const decisions = inferDecisions(note.body);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "meeting-attendees-decisions",
      provider: "local-placeholder",
      note: notePayload(note),
      cleanedBody: [
        "Attendees:",
        attendees.length ? attendees.map((attendee) => `- ${attendee}`).join("\n") : "- None captured yet.",
        "",
        "Decisions:",
        decisions.length ? decisions.map((decision) => `- ${decision}`).join("\n") : "- None captured yet."
      ].join("\n"),
      meetingMeta: {
        attendees,
        decisions,
        sourceType: "ai-local"
      },
      replaceableWithAi: true
    }
  });
};

export const smartInsights = async (req, res) => {
  const notes = await Note.find({ owner: req.user.id }).sort({ updatedAt: -1 }).limit(100);
  const categoryCounts = notes.reduce((acc, note) => {
    const category = note.category || "General";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  const [topCategory = "General", topCategoryCount = 0] =
    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0] || [];
  const pinnedCount = notes.filter((note) => note.pinned).length;
  const starredCount = notes.filter((note) => note.starred).length;
  const recentNote = notes[0];

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "smart-insights",
      provider: "local-placeholder",
      insights: {
        totalNotes: notes.length,
        topCategory,
        topCategoryCount,
        pinnedCount,
        starredCount,
        latestUpdatedTitle: recentNote?.title || "",
        suggestedFocus:
          topCategoryCount > 1
            ? `You are collecting the most notes in ${topCategory}.`
            : "Add more notes to unlock stronger patterns."
      },
      replaceableWithAi: true
    }
  });
};
