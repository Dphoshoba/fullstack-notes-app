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

export const summarizeNote = async (req, res) => {
  const note = await Note.findOne({ _id: req.body.noteId, owner: req.user.id });

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

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
  const note = await Note.findOne({ _id: req.body.noteId, owner: req.user.id });

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

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
