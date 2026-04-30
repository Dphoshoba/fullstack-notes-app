import { StatusCodes } from "http-status-codes";

import { Note } from "../models/Note.js";
import {
  convertToMeetingMinutes as convertNoteToMeetingMinutes,
  extractActionItems as extractNoteActionItems,
  extractAttendeesAndDecisions as extractNoteAttendeesAndDecisions,
  generateSmartInsights,
  suggestTags as suggestNoteTags,
  summarizeNote as summarizeNoteText
} from "../services/aiService.js";
import { ApiError } from "../utils/ApiError.js";

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

const noteToAiText = (note) =>
  [
    `Title: ${note.title || ""}`,
    `Category: ${note.category || "General"}`,
    note.tags?.length ? `Tags: ${note.tags.join(", ")}` : "",
    note.noteType === "meeting" ? "Note type: meeting" : "Note type: standard",
    note.meetingMeta?.attendees?.length ? `Attendees: ${note.meetingMeta.attendees.join(", ")}` : "",
    note.meetingMeta?.agenda ? `Agenda: ${note.meetingMeta.agenda}` : "",
    note.meetingMeta?.decisions?.length ? `Decisions: ${note.meetingMeta.decisions.join("\n")}` : "",
    "",
    "Body:",
    note.body || ""
  ]
    .filter(Boolean)
    .join("\n");

const actionItemsToText = (actionItems) =>
  actionItems.length
    ? actionItems
        .map((item) =>
          [
            `- ${item.text}`,
            item.owner ? `Owner: ${item.owner}` : "",
            item.dueDate ? `Due: ${item.dueDate}` : "",
            item.status ? `Status: ${item.status}` : ""
          ]
            .filter(Boolean)
            .join(" | ")
        )
        .join("\n")
    : "No action items captured yet.";

export const summarizeNote = async (req, res) => {
  const note = await noteLookup(req);
  const summary = await summarizeNoteText(noteToAiText(note));

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "summary",
      provider: "openai",
      note: notePayload(note),
      summary,
      replaceableWithAi: true
    }
  });
};

export const suggestTags = async (req, res) => {
  const note = await noteLookup(req);
  const existingTags = new Set((note.tags || []).map((tag) => tag.toLowerCase()));
  const suggestedTags = (await suggestNoteTags(noteToAiText(note))).filter(
    (tag) => !existingTags.has(tag.toLowerCase())
  );

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "tag-suggestions",
      provider: "openai",
      note: notePayload(note),
      suggestedTags,
      replaceableWithAi: true
    }
  });
};

export const convertToMeetingMinutes = async (req, res) => {
  const note = await noteLookup(req);
  const result = await convertNoteToMeetingMinutes(noteToAiText(note));

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "meeting-minutes",
      provider: "openai",
      note: notePayload(note),
      cleanedBody: result.cleanedBody,
      meetingMeta: {
        meetingDate: note.meetingMeta?.meetingDate || null,
        attendees: result.attendees,
        agenda: result.agenda,
        decisions: result.decisions,
        actionItems: result.actionItems,
        followUpDate: note.meetingMeta?.followUpDate || null,
        sourceType: "ai-openai"
      },
      replaceableWithAi: true
    }
  });
};

export const extractActionItems = async (req, res) => {
  const note = await noteLookup(req);
  const actionItems = await extractNoteActionItems(noteToAiText(note));

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "meeting-action-items",
      provider: "openai",
      note: notePayload(note),
      cleanedBody: actionItemsToText(actionItems),
      meetingMeta: {
        actionItems,
        sourceType: "ai-openai"
      },
      replaceableWithAi: true
    }
  });
};

export const extractAttendeesAndDecisions = async (req, res) => {
  const note = await noteLookup(req);
  const result = await extractNoteAttendeesAndDecisions(noteToAiText(note));

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "meeting-attendees-decisions",
      provider: "openai",
      note: notePayload(note),
      cleanedBody: [
        "Attendees:",
        result.attendees.length ? result.attendees.map((attendee) => `- ${attendee}`).join("\n") : "- None captured yet.",
        "",
        "Decisions:",
        result.decisions.length ? result.decisions.map((decision) => `- ${decision}`).join("\n") : "- None captured yet."
      ].join("\n"),
      meetingMeta: {
        attendees: result.attendees,
        decisions: result.decisions,
        sourceType: "ai-openai"
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
  const [localTopCategory = "General", topCategoryCount = 0] =
    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0] || [];
  const pinnedCount = notes.filter((note) => note.pinned).length;
  const starredCount = notes.filter((note) => note.starred).length;
  const recentNote = notes[0];
  const notesText = notes
    .slice(0, 30)
    .map((note) => `Title: ${note.title}\nCategory: ${note.category || "General"}\nBody: ${note.body}`)
    .join("\n\n---\n\n");
  const aiInsights = await generateSmartInsights(notesText);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "smart-insights",
      provider: "openai",
      insights: {
        totalNotes: notes.length,
        topCategory: aiInsights.topCategory || localTopCategory,
        topCategoryCount,
        pinnedCount,
        starredCount,
        latestUpdatedTitle: recentNote?.title || "",
        suggestedFocus: aiInsights.suggestedFocus
      },
      replaceableWithAi: true
    }
  });
};
