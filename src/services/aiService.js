import OpenAI from "openai";
import { StatusCodes } from "http-status-codes";

import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

let client;

const getClient = () => {
  if (!env.OPENAI_API_KEY) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, "AI is not configured. Add OPENAI_API_KEY to enable AI tools.");
  }

  if (!client) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  return client;
};

const truncateInput = (value, maxLength = 12000) => String(value || "").slice(0, maxLength);

const runTextPrompt = async ({ instructions, input, maxOutputTokens = 700 }) => {
  try {
    const response = await getClient().responses.create({
      model: env.OPENAI_MODEL,
      instructions,
      input: truncateInput(input),
      max_output_tokens: maxOutputTokens,
      text: {
        verbosity: "low"
      }
    });

    return response.output_text?.trim() || "";
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(StatusCodes.BAD_GATEWAY, "AI request failed. Please try again.");
  }
};

const runJsonPrompt = async ({ instructions, input, name, schema, maxOutputTokens = 1200 }) => {
  try {
    const response = await getClient().responses.create({
      model: env.OPENAI_MODEL,
      instructions,
      input: truncateInput(input),
      max_output_tokens: maxOutputTokens,
      text: {
        format: {
          type: "json_schema",
          name,
          strict: true,
          schema
        },
        verbosity: "low"
      }
    });

    return JSON.parse(response.output_text || "{}");
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(StatusCodes.BAD_GATEWAY, "AI request failed. Please try again.");
  }
};

export const summarizeNote = (noteText) =>
  runTextPrompt({
    instructions: [
      "You summarize user notes for a productivity app.",
      "Return clean plain text only.",
      "Keep the summary concise, specific, and useful.",
      "Do not invent facts that are not present in the note."
    ].join(" "),
    input: `Summarize this note in 2-4 short sentences:\n\n${noteText}`,
    maxOutputTokens: 350
  });

export const suggestTags = async (noteText) => {
  const result = await runJsonPrompt({
    instructions: [
      "You suggest tags for a notes app.",
      "Return concise lowercase tags.",
      "Do not include sensitive personal data as tags."
    ].join(" "),
    input: `Suggest up to 8 useful tags for this note:\n\n${noteText}`,
    name: "tag_suggestions",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        tags: {
          type: "array",
          maxItems: 8,
          items: { type: "string" }
        }
      },
      required: ["tags"]
    }
  });

  return Array.isArray(result.tags) ? result.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];
};

export const convertToMeetingMinutes = async (noteText) => {
  const result = await runJsonPrompt({
    instructions: [
      "You convert rough meeting notes into clean meeting minutes.",
      "Return structured JSON only.",
      "Preserve facts from the note and do not invent attendees, decisions, or due dates."
    ].join(" "),
    input: `Convert this note into meeting minutes and structured meeting details:\n\n${noteText}`,
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
              status: { type: "string", enum: ["open", "done"] }
            },
            required: ["text", "owner", "dueDate", "status"]
          }
        }
      },
      required: ["cleanedBody", "attendees", "agenda", "decisions", "actionItems"]
    },
    maxOutputTokens: 1800
  });

  return {
    cleanedBody: result.cleanedBody || "",
    attendees: Array.isArray(result.attendees) ? result.attendees : [],
    agenda: result.agenda || "",
    decisions: Array.isArray(result.decisions) ? result.decisions : [],
    actionItems: Array.isArray(result.actionItems) ? result.actionItems : []
  };
};

export const extractActionItems = async (noteText) => {
  const result = await runJsonPrompt({
    instructions: [
      "You extract action items from meeting notes.",
      "Return JSON only.",
      "Use empty strings when owner or due date is not stated.",
      "Use status open for all newly extracted tasks unless the note explicitly says done."
    ].join(" "),
    input: `Extract action items from this note:\n\n${noteText}`,
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
              status: { type: "string", enum: ["open", "done"] }
            },
            required: ["text", "owner", "dueDate", "status"]
          }
        }
      },
      required: ["actionItems"]
    }
  });

  return Array.isArray(result.actionItems) ? result.actionItems : [];
};

export const extractAttendeesAndDecisions = async (noteText) => {
  const result = await runJsonPrompt({
    instructions: [
      "You extract attendees and decisions from meeting notes.",
      "Return JSON only.",
      "Do not infer names or decisions that are not present."
    ].join(" "),
    input: `Extract attendees and decisions from this note:\n\n${noteText}`,
    name: "meeting_attendees_decisions",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        attendees: { type: "array", items: { type: "string" } },
        decisions: { type: "array", items: { type: "string" } }
      },
      required: ["attendees", "decisions"]
    }
  });

  return {
    attendees: Array.isArray(result.attendees) ? result.attendees : [],
    decisions: Array.isArray(result.decisions) ? result.decisions : []
  };
};

export const generateSmartInsights = async (notesText) => {
  const result = await runJsonPrompt({
    instructions: [
      "You generate brief productivity insights from a user's notes.",
      "Return JSON only.",
      "Do not include sensitive personal details."
    ].join(" "),
    input: `Generate simple insights for these notes:\n\n${notesText}`,
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
    maxOutputTokens: 500
  });

  return {
    topCategory: result.topCategory || "General",
    suggestedFocus: result.suggestedFocus || "Add more notes to unlock stronger patterns."
  };
};
