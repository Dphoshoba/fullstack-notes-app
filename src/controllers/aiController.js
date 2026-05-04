import { StatusCodes } from "http-status-codes";

import { Note } from "../models/Note.js";
import {
  createExecutiveSummary as createNoteExecutiveSummary,
  createFollowUpEmail as createNoteFollowUpEmail,
  convertToMeetingMinutes as convertNoteToMeetingMinutes,
  extractActionItems as extractNoteActionItems,
  extractAttendeesAndDecisions as extractNoteAttendeesAndDecisions,
  extractTasks as extractNoteTasks,
  generateSmartInsights,
  generateStudyNotes as generateNoteStudyNotes,
  improveWriting as improveNoteWriting,
  smartSuggestions as generateSmartSuggestions,
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

const tasksToText = (tasks) =>
  tasks.length
    ? tasks
        .map((item) =>
          [
            `- ${item.text}`,
            item.owner ? `Owner: ${item.owner}` : "",
            item.dueDate ? `Due: ${item.dueDate}` : "",
            item.priority ? `Priority: ${item.priority}` : "",
            item.status ? `Status: ${item.status}` : ""
          ]
            .filter(Boolean)
            .join(" | ")
        )
        .join("\n")
    : "No tasks captured yet.";

const followUpEmailToText = (email) =>
  [`Subject: ${email.subject || ""}`, "", email.body || ""].join("\n");

export const summarizeNote = async (req, res) => {
  const note = await noteLookup(req);
  const summary = await summarizeNoteText(noteToAiText(note));

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "summary",
      provider: "openai",
      source: "openai",
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
      source: "openai",
      note: notePayload(note),
      suggestedTags,
      replaceableWithAi: true
    }
  });
};

export const improveWriting = async (req, res) => {
  const note = await noteLookup(req);
  const cleanedBody = await improveNoteWriting(noteToAiText(note));

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "improve-writing",
      provider: "openai",
      source: "openai",
      note: notePayload(note),
      cleanedBody,
      replaceableWithAi: true
    }
  });
};

export const extractTasks = async (req, res) => {
  const note = await noteLookup(req);
  const tasks = await extractNoteTasks(noteToAiText(note));

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "extract-tasks",
      provider: "openai",
      source: "openai",
      note: notePayload(note),
      tasks,
      cleanedBody: tasksToText(tasks),
      replaceableWithAi: true
    }
  });
};

export const createExecutiveSummary = async (req, res) => {
  const note = await noteLookup(req);
  const cleanedBody = await createNoteExecutiveSummary(noteToAiText(note));

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "executive-summary",
      provider: "openai",
      source: "openai",
      note: notePayload(note),
      cleanedBody,
      replaceableWithAi: true
    }
  });
};

export const createFollowUpEmail = async (req, res) => {
  const note = await noteLookup(req);
  const email = await createNoteFollowUpEmail(noteToAiText(note));

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "follow-up-email",
      provider: "openai",
      source: "openai",
      note: notePayload(note),
      email,
      cleanedBody: followUpEmailToText(email),
      replaceableWithAi: true
    }
  });
};

export const generateStudyNotes = async (req, res) => {
  const note = await noteLookup(req);
  const cleanedBody = await generateNoteStudyNotes(noteToAiText(note));

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "study-notes",
      provider: "openai",
      source: "openai",
      note: notePayload(note),
      cleanedBody,
      replaceableWithAi: true
    }
  });
};

export const smartSuggestions = async (req, res) => {
  const suggestions = await generateSmartSuggestions({
    title: req.body.title,
    body: req.body.body,
    noteType: req.body.noteType
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      type: "smart-suggestions",
      provider: "openai",
      source: "openai",
      suggestions,
      replaceableWithAi: false
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
      source: "openai",
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
      source: "openai",
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
      source: "openai",
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
      source: "openai",
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
