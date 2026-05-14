import { StatusCodes } from "http-status-codes";

import { Note } from "../models/Note.js";
import {
  createExecutiveSummary as createNoteExecutiveSummary,
  createFollowUpEmail as createNoteFollowUpEmail,
  convertToMeetingMinutes as convertNoteToMeetingMinutes,
  extractActionItems as extractNoteActionItems,
  extractAttendeesAndDecisions as extractNoteAttendeesAndDecisions,
  extractTasks as extractNoteTasks,
  generateInsightsDashboardNarrative,
  generateDailyBriefingNarrative,
  generateMeetingFollowUpEmailDraft,
  generateMeetingIntelligence,
  rankNotesForSemanticSearch,
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

const userWorkspaceId = (user) => user.organizationId?.toString();

const buildSemanticVisibilityFilter = (user) => {
  const privateFilter = {
    owner: user.id,
    $or: [{ visibility: "private" }, { visibility: { $exists: false } }]
  };
  const workspaceId = userWorkspaceId(user);
  if (!workspaceId) {
    return privateFilter;
  }
  return {
    $or: [privateFilter, { visibility: "workspace", organizationId: user.organizationId }]
  };
};

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const normalizeActionItemEntries = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return { text: item.trim(), dueDate: "", owner: "", status: "" };
        }
        return {
          text: String(item?.text || "").trim(),
          dueDate: item?.dueDate ? String(item.dueDate) : "",
          owner: String(item?.owner || "").trim(),
          status: String(item?.status || "").trim()
        };
      })
      .filter((item) => item.text);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .map((text) => ({ text, dueDate: "", owner: "", status: "" }));
};

const isOpenActionItem = (item) => {
  const status = String(item.status || "").toLowerCase();
  return !status || status === "open" || status === "pending" || status === "todo";
};

const isMeetingNote = (note) =>
  note.noteType === "meeting" ||
  Boolean(note.meetingMeta && Object.keys(note.meetingMeta).length);

const formatDueLabel = (value) => {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value).trim();
  }
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const parseDueSortKey = (value) => {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
};

const buildEmptyBriefing = (date) => ({
  date,
  topPriorities: [],
  upcomingDeadlines: [],
  suggestedFollowUps: [],
  recentMeetingActions: [],
  dailySummary: "",
  suggestedFocus: "",
  productivityReminder:
    "Add notes and meeting records to receive a personalized daily briefing."
});

const buildLocalProductivityReminder = ({
  topPriorities,
  recentMeetingActions,
  suggestedFollowUps
}) => {
  if (topPriorities.length) {
    return `Start with your top priority: "${topPriorities[0]}".`;
  }
  if (recentMeetingActions.length) {
    return `Review ${recentMeetingActions.length} open meeting action item${recentMeetingActions.length === 1 ? "" : "s"} today.`;
  }
  if (suggestedFollowUps.length) {
    return `Knock out a follow-up: "${suggestedFollowUps[0]}".`;
  }
  return "Capture today's priorities in a note to keep your briefing fresh.";
};

const buildFallbackDailySummary = (briefing) => {
  const parts = [];
  if (briefing.topPriorities.length) {
    parts.push(
      `${briefing.topPriorities.length} top priorit${briefing.topPriorities.length === 1 ? "y" : "ies"}`
    );
  }
  if (briefing.upcomingDeadlines.length) {
    parts.push(
      `${briefing.upcomingDeadlines.length} upcoming deadline${briefing.upcomingDeadlines.length === 1 ? "" : "s"}`
    );
  }
  if (briefing.recentMeetingActions.length) {
    parts.push("recent meeting action items");
  }
  if (!parts.length) {
    return "";
  }
  return `Today's briefing highlights ${parts.join(", ")}.`;
};

const buildFallbackSuggestedFocus = (briefing) => {
  if (briefing.topPriorities[0]) {
    return `Focus first on: ${briefing.topPriorities[0]}`;
  }
  if (briefing.recentMeetingActions[0]?.action) {
    return `Tackle meeting action: ${briefing.recentMeetingActions[0].action}`;
  }
  if (briefing.suggestedFollowUps[0]) {
    return `Follow up on: ${briefing.suggestedFollowUps[0]}`;
  }
  return "Review your notes and pick one clear next step for today.";
};

const briefingHasContent = (briefing) =>
  Boolean(
    briefing.topPriorities.length ||
      briefing.upcomingDeadlines.length ||
      briefing.suggestedFollowUps.length ||
      briefing.recentMeetingActions.length
  );

const buildBriefingFactsPayload = (briefing) =>
  JSON.stringify({
    date: briefing.date,
    topPriorities: briefing.topPriorities.slice(0, 5),
    upcomingDeadlines: briefing.upcomingDeadlines.slice(0, 6).map((item) => ({
      label: String(item.label || "").slice(0, 120),
      due: String(item.due || "").slice(0, 80)
    })),
    suggestedFollowUps: briefing.suggestedFollowUps.slice(0, 6).map((item) => String(item).slice(0, 140)),
    recentMeetingActions: briefing.recentMeetingActions.slice(0, 6).map((item) => ({
      title: String(item.title || "").slice(0, 100),
      action: String(item.action || "").slice(0, 140)
    }))
  });

const assembleLocalDailyBriefing = (notes, date) => {
  const meetingNotes = notes.filter(isMeetingNote);
  const seenFollowUps = new Set();
  const suggestedFollowUps = [];
  const upcomingDeadlines = [];
  const priorityCandidates = [];

  for (const note of notes) {
    const meta = note.meetingMeta || {};

    if (note.pinned) {
      priorityCandidates.push({ text: note.title || "Untitled note", rank: 0 });
    }

    (Array.isArray(meta.followUps) ? meta.followUps : []).forEach((item) => {
      const text = String(item || "").trim();
      if (!text || seenFollowUps.has(text.toLowerCase())) {
        return;
      }
      seenFollowUps.add(text.toLowerCase());
      suggestedFollowUps.push(text);
    });

    (Array.isArray(meta.deadlines) ? meta.deadlines : []).forEach((item) => {
      const label = String(item || "").trim();
      if (label) {
        upcomingDeadlines.push({ label, due: formatDueLabel(label) || label });
      }
    });

    if (meta.followUpDate) {
      upcomingDeadlines.push({
        label: `Follow up: ${note.title || "Meeting note"}`,
        due: formatDueLabel(meta.followUpDate)
      });
    }

    normalizeActionItemEntries(meta.actionItems).forEach((item) => {
      if (item.dueDate) {
        upcomingDeadlines.push({
          label: item.text,
          due: formatDueLabel(item.dueDate)
        });
      }
      if (isOpenActionItem(item)) {
        priorityCandidates.push({ text: item.text, rank: 2 });
      }
    });
  }

  notes
    .filter((note) => note.starred && !note.pinned)
    .slice(0, 3)
    .forEach((note) => {
      priorityCandidates.push({ text: note.title || "Untitled note", rank: 1 });
    });

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  notes
    .filter((note) => new Date(note.updatedAt || note.createdAt).getTime() >= weekAgo)
    .slice(0, 5)
    .forEach((note) => {
      priorityCandidates.push({ text: note.title || "Untitled note", rank: 3 });
    });

  const topPriorities = [];
  const seenPriorities = new Set();
  priorityCandidates
    .sort((a, b) => a.rank - b.rank)
    .forEach(({ text }) => {
      const key = text.toLowerCase();
      if (seenPriorities.has(key) || topPriorities.length >= 5) {
        return;
      }
      seenPriorities.add(key);
      topPriorities.push(text);
    });

  const recentMeetingActions = [];
  meetingNotes.slice(0, 10).forEach((note) => {
    if (recentMeetingActions.length >= 6) {
      return;
    }
    const items = normalizeActionItemEntries(note.meetingMeta?.actionItems).filter(isOpenActionItem);
    if (!items.length) {
      return;
    }
    recentMeetingActions.push({
      title: note.title || "Meeting note",
      action: items[0].text
    });
  });

  const sortedDeadlines = upcomingDeadlines
    .sort((a, b) => parseDueSortKey(a.due) - parseDueSortKey(b.due))
    .slice(0, 6);

  const localCore = {
    date,
    topPriorities,
    upcomingDeadlines: sortedDeadlines,
    suggestedFollowUps: suggestedFollowUps.slice(0, 6),
    recentMeetingActions
  };

  return {
    ...localCore,
    productivityReminder: buildLocalProductivityReminder(localCore)
  };
};

const excerptForQuery = (text, query) => {
  const source = String(text || "").trim();
  if (!source) {
    return "";
  }
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) {
    return source.slice(0, 220);
  }
  const index = source.toLowerCase().indexOf(needle);
  if (index < 0) {
    return source.slice(0, 220);
  }
  const start = Math.max(0, index - 80);
  const end = Math.min(source.length, index + needle.length + 120);
  return source.slice(start, end);
};

const keywordScore = (note, query) => {
  const terms = String(query || "")
    .toLowerCase()
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
  if (!terms.length) {
    return 0;
  }
  const haystack = [
    note.title || "",
    note.body || "",
    Array.isArray(note.tags) ? note.tags.join(" ") : "",
    note.category || "",
    Array.isArray(note.meetingMeta?.attendees) ? note.meetingMeta.attendees.join(" ") : "",
    Array.isArray(note.meetingMeta?.decisions) ? note.meetingMeta.decisions.join(" ") : "",
    note.meetingMeta?.agenda || "",
    note.meetingMeta?.executiveSummary || ""
  ]
    .join(" ")
    .toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) {
      score += 12;
    }
  }
  if (note.title && terms.some((term) => String(note.title).toLowerCase().includes(term))) {
    score += 8;
  }
  return Math.min(score, 100);
};

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

export const insightsDashboard = async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  const ownerId = req.user.id;
  const [totalNotes, meetingNotesCount, topCategoriesRaw, recentNotes] = await Promise.all([
    Note.countDocuments({ owner: ownerId }),
    Note.countDocuments({ owner: ownerId, noteType: "meeting" }),
    Note.aggregate([
      { $match: { owner: req.user._id } },
      { $group: { _id: { $ifNull: ["$category", "General"] }, count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 5 }
    ]),
    Note.find({ owner: ownerId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("title body tags category noteType")
      .lean()
  ]);
  const standardNotesCount = Math.max(totalNotes - meetingNotesCount, 0);
  const topCategories = topCategoriesRaw.map((item) => ({
    category: item._id || "General",
    count: item.count
  }));

  const recentTopics = [];
  const seenTopics = new Set();
  for (const note of recentNotes.slice(0, 12)) {
    const candidates = [note.title, ...(Array.isArray(note.tags) ? note.tags : []), note.category || "General"];
    for (const candidate of candidates) {
      const topic = String(candidate || "").trim();
      if (!topic) {
        continue;
      }
      const normalized = topic.toLowerCase();
      if (seenTopics.has(normalized)) {
        continue;
      }
      seenTopics.add(normalized);
      recentTopics.push(topic);
      if (recentTopics.length >= 8) {
        break;
      }
    }
    if (recentTopics.length >= 8) {
      break;
    }
  }

  let productivitySummary = "";
  let suggestedFocusAreas = [];
  let followUpSuggestions = [];
  if (recentNotes.length) {
    console.info("[aiInsights] OpenAI request start", {
      userId: req.user.id,
      notesAnalyzed: Math.min(recentNotes.length, 12)
    });

    const notesText = recentNotes
      .slice(0, 12)
      .map((note) =>
        [
          `Title: ${String(note.title || "").slice(0, 120)}`,
          `Category: ${String(note.category || "General").slice(0, 60)}`,
          `Type: ${note.noteType === "meeting" ? "meeting" : "standard"}`,
          `Tags: ${Array.isArray(note.tags) ? note.tags.slice(0, 5).join(", ") : ""}`,
          `Body: ${String(note.body || "").slice(0, 360)}`
        ]
          .filter(Boolean)
          .join("\n")
      )
      .join("\n\n---\n\n");

    try {
      const generated = await generateInsightsDashboardNarrative(notesText);
      productivitySummary = generated.productivitySummary;
      suggestedFocusAreas = generated.suggestedFocusAreas;
      followUpSuggestions = generated.followUpSuggestions;
    } catch {
      console.error("[aiInsights] OpenAI generation failed, using fallback", {
        userId: req.user.id
      });
      // Keep endpoint resilient and avoid exposing provider failures.
      productivitySummary =
        "Insight generation is temporarily unavailable. Your note metrics are still up to date.";
      suggestedFocusAreas = [];
      followUpSuggestions = [];
    }
  } else {
    productivitySummary = "Add a few notes to unlock personalized productivity insights.";
  }

  return res.status(StatusCodes.OK).json({
    totalNotes,
    meetingNotesCount,
    standardNotesCount,
    topCategories,
    recentTopics,
    openActionItems: [],
    suggestedFocusAreas,
    productivitySummary,
    followUpSuggestions
  });
};

export const meetingIntelligence = async (req, res) => {
  const noteId = req.body.noteId || "";
  const rawContent = String(req.body.content || "").trim();
  let note = null;

  if (noteId) {
    note = await Note.findOne({ _id: noteId, owner: req.user.id });
    if (!note) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
    }
  }

  const content = rawContent || (note ? noteToAiText(note) : "");
  if (!content.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Meeting content is required");
  }

  let intelligence;
  try {
    intelligence = await generateMeetingIntelligence(content);
  } catch {
    intelligence = {
      attendees: [],
      decisions: [],
      actionItems: [],
      blockers: [],
      risks: [],
      deadlines: [],
      followUps: [],
      executiveSummary: "Meeting intelligence is temporarily unavailable.",
      meetingType: "",
      priorityLevel: ""
    };
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: intelligence
  });
};

export const meetingFollowUpEmail = async (req, res) => {
  const noteId = req.body.noteId || "";
  const providedIntelligence = req.body.meetingIntelligence || {};
  const providedMeetingContent = String(req.body.meetingContent || "").trim();
  let note = null;

  if (noteId) {
    note = await Note.findOne({ _id: noteId, owner: req.user.id });
    if (!note) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
    }
  }

  const sourceIntelligence = Object.keys(providedIntelligence).length
    ? providedIntelligence
    : note?.meetingMeta || {};
  const recipientsSeed = Array.isArray(sourceIntelligence.attendees)
    ? sourceIntelligence.attendees
    : [];
  const meetingContextText = [
    note ? `Title: ${note.title || ""}` : "",
    note ? `Category: ${note.category || "General"}` : "",
    note ? `Note type: ${note.noteType || "standard"}` : "",
    sourceIntelligence.executiveSummary ? `Executive summary: ${sourceIntelligence.executiveSummary}` : "",
    sourceIntelligence.meetingType ? `Meeting type: ${sourceIntelligence.meetingType}` : "",
    sourceIntelligence.priorityLevel ? `Priority level: ${sourceIntelligence.priorityLevel}` : "",
    Array.isArray(sourceIntelligence.attendees) && sourceIntelligence.attendees.length
      ? `Attendees: ${sourceIntelligence.attendees.join(", ")}`
      : "",
    Array.isArray(sourceIntelligence.decisions) && sourceIntelligence.decisions.length
      ? `Decisions:\n${sourceIntelligence.decisions.map((item) => `- ${item}`).join("\n")}`
      : "",
    Array.isArray(sourceIntelligence.actionItems) && sourceIntelligence.actionItems.length
      ? `Action items:\n${sourceIntelligence.actionItems.map((item) => `- ${item}`).join("\n")}`
      : "",
    Array.isArray(sourceIntelligence.blockers) && sourceIntelligence.blockers.length
      ? `Blockers:\n${sourceIntelligence.blockers.map((item) => `- ${item}`).join("\n")}`
      : "",
    Array.isArray(sourceIntelligence.risks) && sourceIntelligence.risks.length
      ? `Risks:\n${sourceIntelligence.risks.map((item) => `- ${item}`).join("\n")}`
      : "",
    Array.isArray(sourceIntelligence.deadlines) && sourceIntelligence.deadlines.length
      ? `Deadlines:\n${sourceIntelligence.deadlines.map((item) => `- ${item}`).join("\n")}`
      : "",
    Array.isArray(sourceIntelligence.followUps) && sourceIntelligence.followUps.length
      ? `Follow-ups:\n${sourceIntelligence.followUps.map((item) => `- ${item}`).join("\n")}`
      : "",
    providedMeetingContent ? `Meeting content:\n${providedMeetingContent}` : "",
    !providedMeetingContent && note?.body ? `Meeting content:\n${note.body}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");

  if (!meetingContextText.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Meeting content is required");
  }

  const draft = await generateMeetingFollowUpEmailDraft(meetingContextText, recipientsSeed);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      subject: draft.subject,
      body: draft.body,
      recipients: draft.recipients
    }
  });
};

export const semanticSearch = async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (!query) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Search query is required");
  }

  const notes = await Note.find(buildSemanticVisibilityFilter(req.user))
    .sort({ updatedAt: -1 })
    .limit(60)
    .select("title body tags category noteType meetingMeta updatedAt")
    .lean();

  if (!notes.length) {
    return res.status(StatusCodes.OK).json({
      success: true,
      data: []
    });
  }

  const preRanked = notes
    .map((note) => ({ note, score: keywordScore(note, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);
  const candidatePool = preRanked.length ? preRanked.map((item) => item.note) : notes.slice(0, 20);

  const candidates = candidatePool.map((note) => ({
    noteId: note._id.toString(),
    title: note.title || "Untitled",
    tags: note.tags || [],
    category: note.category || "General",
    noteType: note.noteType || "standard",
    snippet: excerptForQuery(note.body || "", query),
    meetingMetaSummary:
      note.noteType === "meeting"
        ? [
            note.meetingMeta?.executiveSummary || "",
            Array.isArray(note.meetingMeta?.decisions) ? note.meetingMeta.decisions.join(" | ") : ""
          ]
            .filter(Boolean)
            .join(" ")
        : ""
  }));

  let aiRanking = [];
  try {
    aiRanking = await rankNotesForSemanticSearch(query, candidates);
  } catch {
    aiRanking = [];
  }

  const aiRankMap = new Map(aiRanking.map((item) => [item.noteId, item]));
  const results = candidates
    .map((candidate, index) => {
      const aiRank = aiRankMap.get(candidate.noteId);
      const fallback = preRanked.find((item) => item.note._id.toString() === candidate.noteId);
      const score = aiRank ? aiRank.score : fallback?.score || Math.max(10, 60 - index * 2);
      return {
        noteId: candidate.noteId,
        title: candidate.title,
        excerpt: candidate.snippet || String(candidate.meetingMetaSummary || "").slice(0, 220),
        relevanceReason: aiRank?.relevanceReason || "Keyword and context match from your accessible notes.",
        score
      };
    })
    .filter((item) => item.excerpt)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: results
  });
};

export const dailyBriefing = async (req, res) => {
  const date = todayIsoDate();
  const notes = await Note.find(buildSemanticVisibilityFilter(req.user))
    .sort({ updatedAt: -1 })
    .limit(60)
    .select("title noteType meetingMeta pinned starred updatedAt createdAt")
    .lean();

  if (!notes.length) {
    return res.status(StatusCodes.OK).json({
      success: true,
      data: buildEmptyBriefing(date)
    });
  }

  const localBriefing = assembleLocalDailyBriefing(notes, date);
  const fallbackNarrative = {
    dailySummary: buildFallbackDailySummary(localBriefing),
    suggestedFocus: buildFallbackSuggestedFocus(localBriefing),
    productivityReminder: localBriefing.productivityReminder
  };

  let narrative = fallbackNarrative;
  if (briefingHasContent(localBriefing)) {
    try {
      const generated = await generateDailyBriefingNarrative(buildBriefingFactsPayload(localBriefing));
      narrative = {
        dailySummary: generated.dailySummary || fallbackNarrative.dailySummary,
        suggestedFocus: generated.suggestedFocus || fallbackNarrative.suggestedFocus,
        productivityReminder: generated.productivityReminder || fallbackNarrative.productivityReminder
      };
    } catch {
      console.error("[dailyBriefing] OpenAI narrative failed, using local fallback", {
        userId: req.user?.id
      });
    }
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      date: localBriefing.date,
      topPriorities: localBriefing.topPriorities,
      upcomingDeadlines: localBriefing.upcomingDeadlines,
      suggestedFollowUps: localBriefing.suggestedFollowUps,
      recentMeetingActions: localBriefing.recentMeetingActions,
      dailySummary: narrative.dailySummary,
      suggestedFocus: narrative.suggestedFocus,
      productivityReminder: narrative.productivityReminder
    }
  });
};
