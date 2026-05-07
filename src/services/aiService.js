import { StatusCodes } from "http-status-codes";
import OpenAI from "openai";

import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const AI_UNAVAILABLE_MESSAGE = "AI service unavailable. Please try again.";
const EMPTY_MEETING_RESULT = {
  cleanedBody: "",
  attendees: [],
  agenda: "",
  decisions: [],
  actionItems: []
};
const EMPTY_ATTENDEES_DECISIONS = {
  attendees: [],
  decisions: []
};
const EMPTY_FOLLOW_UP_EMAIL = {
  subject: "",
  body: ""
};
const EMPTY_SMART_SUGGESTIONS = {
  missingDetails: [],
  possibleTags: [],
  suggestedTitle: "",
  actionItems: []
};
const EMPTY_INSIGHTS = {
  topCategory: "General",
  suggestedFocus: "Review your recent notes to identify the next useful priority."
};
const EMPTY_DASHBOARD_INSIGHTS = {
  productivitySummary: "",
  suggestedFocusAreas: [],
  followUpSuggestions: []
};

let client;

const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, AI_UNAVAILABLE_MESSAGE);
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
};

const truncateInput = (value, maxLength = 12000) => String(value || "").slice(0, maxLength);

const cleanStringArray = (items, maxItems) =>
  (Array.isArray(items) ? items : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, maxItems);

const parseJson = (value, fallback) => {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const runTextPrompt = async ({ system, user, maxCompletionTokens = 700 }) => {
  try {
    const response = await getClient().chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: truncateInput(user) }
      ],
      max_completion_tokens: maxCompletionTokens
    });

    return response.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(StatusCodes.BAD_GATEWAY, AI_UNAVAILABLE_MESSAGE);
  }
};

const runJsonPrompt = async ({ system, user, name, schema, fallback, maxCompletionTokens = 1200 }) => {
  try {
    const response = await getClient().chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: truncateInput(user) }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name,
          strict: true,
          schema
        }
      },
      max_completion_tokens: maxCompletionTokens
    });

    return parseJson(response.choices?.[0]?.message?.content, fallback);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(StatusCodes.BAD_GATEWAY, AI_UNAVAILABLE_MESSAGE);
  }
};

export const summarizeNote = (noteText) =>
  runTextPrompt({
    system: [
      "You summarize user notes for a productivity app.",
      "Return clean plain text only.",
      "Keep the summary concise, specific, and useful.",
      "Do not invent facts that are not present in the note."
    ].join(" "),
    user: `Summarize this note in 2-4 short sentences:\n\n${noteText}`,
    maxCompletionTokens: 350
  });

export const suggestTags = async (noteText) => {
  const result = await runJsonPrompt({
    system: [
      "You suggest tags for a notes app.",
      "Return 3 to 6 relevant lowercase tags.",
      "Use short tags and do not include sensitive personal data."
    ].join(" "),
    user: `Suggest 3 to 6 useful tags for this note:\n\n${noteText}`,
    name: "tag_suggestions",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        tags: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: { type: "string" }
        }
      },
      required: ["tags"]
    },
    fallback: { tags: [] },
    maxCompletionTokens: 350
  });

  return cleanStringArray(result.tags, 6);
};

export const improveWriting = (noteText) =>
  runTextPrompt({
    system: [
      "You improve writing for a notes app.",
      "Return clean plain text only.",
      "Make the note clearer, more concise, and more professional.",
      "Preserve the user's meaning and do not add facts."
    ].join(" "),
    user: `Improve the writing in this note while preserving meaning:\n\n${noteText}`,
    maxCompletionTokens: 1000
  });

export const createExecutiveSummary = (noteText) =>
  runTextPrompt({
    system: [
      "You create executive summaries from notes.",
      "Return clean plain text only.",
      "Make it concise, decision-oriented, and useful for a busy leader.",
      "Use short sections when helpful and do not invent facts."
    ].join(" "),
    user: `Create an executive summary from this note:\n\n${noteText}`,
    maxCompletionTokens: 900
  });

export const generateStudyNotes = (noteText) =>
  runTextPrompt({
    system: [
      "You create study notes from user notes.",
      "Return clean plain text only.",
      "Use clear headings, key points, important terms, and review questions.",
      "Do not invent facts beyond the note."
    ].join(" "),
    user: `Turn this note into study notes:\n\n${noteText}`,
    maxCompletionTokens: 1200
  });

export const createFollowUpEmail = async (noteText) => {
  const result = await runJsonPrompt({
    system: [
      "You draft follow-up emails from notes.",
      "Return JSON only.",
      "Write a clear subject and a concise professional email body.",
      "Do not invent facts, deadlines, names, or commitments."
    ].join(" "),
    user: `Create a follow-up email from this note:\n\n${noteText}`,
    name: "follow_up_email",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        subject: { type: "string" },
        body: { type: "string" }
      },
      required: ["subject", "body"]
    },
    fallback: EMPTY_FOLLOW_UP_EMAIL,
    maxCompletionTokens: 900
  });

  return {
    subject: String(result.subject || "").trim(),
    body: String(result.body || "").trim()
  };
};

export const extractTasks = async (noteText) => {
  const result = await runJsonPrompt({
    system: [
      "You extract practical tasks from notes.",
      "Return JSON only.",
      "Use empty strings when owner, due date, or priority is not stated.",
      "Every task must have status open.",
      "Priority must be high, medium, low, or an empty string."
    ].join(" "),
    user: `Extract tasks from this note:\n\n${noteText}`,
    name: "note_tasks",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        tasks: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              text: { type: "string" },
              owner: { type: "string" },
              dueDate: { type: "string" },
              priority: { type: "string", enum: ["", "low", "medium", "high"] },
              status: { type: "string", enum: ["open"] }
            },
            required: ["text", "owner", "dueDate", "priority", "status"]
          }
        }
      },
      required: ["tasks"]
    },
    fallback: { tasks: [] },
    maxCompletionTokens: 1200
  });

  return normalizeTasks(result.tasks);
};

export const smartSuggestions = async ({ title, body, noteType }) => {
  const result = await runJsonPrompt({
    system: [
      "You provide short smart suggestions while a user writes a note.",
      "Return JSON only.",
      "Keep suggestions concise, practical, and based only on the provided draft.",
      "Do not invent people, dates, commitments, or facts.",
      "Use empty arrays when nothing useful is found."
    ].join(" "),
    user: [
      `Title: ${title || ""}`,
      `Note type: ${noteType || "standard"}`,
      "",
      "Body:",
      body || ""
    ].join("\n"),
    name: "smart_suggestions",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        missingDetails: {
          type: "array",
          maxItems: 5,
          items: { type: "string" }
        },
        possibleTags: {
          type: "array",
          maxItems: 6,
          items: { type: "string" }
        },
        suggestedTitle: { type: "string" },
        actionItems: {
          type: "array",
          maxItems: 5,
          items: { type: "string" }
        }
      },
      required: ["missingDetails", "possibleTags", "suggestedTitle", "actionItems"]
    },
    fallback: EMPTY_SMART_SUGGESTIONS,
    maxCompletionTokens: 900
  });

  return {
    missingDetails: cleanStringArray(result.missingDetails, 5),
    possibleTags: cleanStringArray(result.possibleTags, 6).map((tag) => tag.toLowerCase()),
    suggestedTitle: String(result.suggestedTitle || "").trim(),
    actionItems: cleanStringArray(result.actionItems, 5)
  };
};

export const convertToMeetingMinutes = async (noteText) => {
  const result = await runJsonPrompt({
    system: [
      "You convert rough meeting notes into clear meeting minutes.",
      "Return JSON only.",
      "Preserve facts from the note and do not invent attendees, decisions, owners, or due dates.",
      "The cleaned body must use these sections: Agenda, Discussion, Decisions, Action items, Next steps."
    ].join(" "),
    user: `Convert this note into structured meeting minutes:\n\n${noteText}`,
    name: "meeting_minutes",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        cleanedBody: { type: "string" },
        attendees: { type: "array", items: { type: "string" } },
        agenda: { type: "string" },
        decisions: { type: "array", items: { type: "string" } },
        actionItems: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              text: { type: "string" },
              owner: { type: "string" },
              dueDate: { type: "string" },
              status: { type: "string", enum: ["open"] }
            },
            required: ["text", "owner", "dueDate", "status"]
          }
        }
      },
      required: ["cleanedBody", "attendees", "agenda", "decisions", "actionItems"]
    },
    fallback: EMPTY_MEETING_RESULT,
    maxCompletionTokens: 1800
  });

  return {
    cleanedBody: result.cleanedBody || "",
    attendees: cleanStringArray(result.attendees),
    agenda: result.agenda || "",
    decisions: cleanStringArray(result.decisions),
    actionItems: normalizeActionItems(result.actionItems)
  };
};

export const extractActionItems = async (noteText) => {
  const result = await runJsonPrompt({
    system: [
      "You extract action items from meeting notes.",
      "Return JSON only.",
      "Use empty strings when owner or due date is not stated.",
      "Every returned task must have status open."
    ].join(" "),
    user: `Extract action items from this note:\n\n${noteText}`,
    name: "meeting_action_items",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        actionItems: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              text: { type: "string" },
              owner: { type: "string" },
              dueDate: { type: "string" },
              status: { type: "string", enum: ["open"] }
            },
            required: ["text", "owner", "dueDate", "status"]
          }
        }
      },
      required: ["actionItems"]
    },
    fallback: { actionItems: [] }
  });

  return normalizeActionItems(result.actionItems);
};

export const extractAttendeesAndDecisions = async (noteText) => {
  const result = await runJsonPrompt({
    system: [
      "You extract attendees and decisions from meeting notes.",
      "Return JSON only.",
      "Do not infer names or decisions that are not present."
    ].join(" "),
    user: `Extract attendees and decisions from this note:\n\n${noteText}`,
    name: "meeting_attendees_decisions",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        attendees: { type: "array", items: { type: "string" } },
        decisions: { type: "array", items: { type: "string" } }
      },
      required: ["attendees", "decisions"]
    },
    fallback: EMPTY_ATTENDEES_DECISIONS
  });

  return {
    attendees: cleanStringArray(result.attendees),
    decisions: cleanStringArray(result.decisions)
  };
};

export const generateSmartInsights = async (notesText) => {
  const result = await runJsonPrompt({
    system: [
      "You generate brief productivity insights from a user's notes.",
      "Return JSON only.",
      "Do not include sensitive personal details."
    ].join(" "),
    user: `Generate simple insights for these notes:\n\n${notesText}`,
    name: "smart_insights",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        topCategory: { type: "string" },
        suggestedFocus: { type: "string" }
      },
      required: ["topCategory", "suggestedFocus"]
    },
    fallback: EMPTY_INSIGHTS,
    maxCompletionTokens: 500
  });

  return {
    topCategory: result.topCategory || "General",
    suggestedFocus: result.suggestedFocus || EMPTY_INSIGHTS.suggestedFocus
  };
};

export const generateInsightsDashboardNarrative = async (notesText) => {
  const result = await runJsonPrompt({
    system: [
      "You generate concise and professional dashboard insights from user notes.",
      "Return JSON only.",
      "Do not include sensitive personal data.",
      "Use neutral, practical language.",
      "If context is weak, return short generic guidance."
    ].join(" "),
    user: [
      "Analyze these recent notes and provide dashboard-ready insights:",
      "",
      notesText
    ].join("\n"),
    name: "insights_dashboard",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        productivitySummary: { type: "string", maxLength: 280 },
        suggestedFocusAreas: {
          type: "array",
          maxItems: 3,
          items: { type: "string", maxLength: 120 }
        },
        followUpSuggestions: {
          type: "array",
          maxItems: 3,
          items: { type: "string", maxLength: 140 }
        }
      },
      required: ["productivitySummary", "suggestedFocusAreas", "followUpSuggestions"]
    },
    fallback: EMPTY_DASHBOARD_INSIGHTS,
    maxCompletionTokens: 450
  });

  return {
    productivitySummary: String(result.productivitySummary || "").trim(),
    suggestedFocusAreas: cleanStringArray(result.suggestedFocusAreas, 3),
    followUpSuggestions: cleanStringArray(result.followUpSuggestions, 3)
  };
};

const normalizeActionItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      text: String(item?.text || "").trim(),
      owner: String(item?.owner || "").trim(),
      dueDate: String(item?.dueDate || "").trim(),
      status: "open"
    }))
    .filter((item) => item.text);

const normalizeTasks = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      text: String(item?.text || "").trim(),
      owner: String(item?.owner || "").trim(),
      dueDate: String(item?.dueDate || "").trim(),
      priority: ["low", "medium", "high"].includes(String(item?.priority || "").toLowerCase())
        ? String(item.priority).toLowerCase()
        : "",
      status: "open"
    }))
    .filter((item) => item.text);
