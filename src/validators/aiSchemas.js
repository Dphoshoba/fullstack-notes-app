import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const noteAiSchema = Joi.object({
  body: Joi.object({
    noteId: objectId.required()
  }).required()
});

export const smartInsightsSchema = Joi.object({
  body: Joi.object({}).default({})
});

export const smartSuggestionsSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().max(120).allow("").default(""),
    body: Joi.string().trim().max(10000).allow("").required(),
    noteType: Joi.string().valid("standard", "meeting").default("standard")
  }).required()
});

export const meetingIntelligenceSchema = Joi.object({
  body: Joi.object({
    noteId: objectId.optional(),
    content: Joi.string().trim().max(12000).allow("").required()
  }).required()
});

const meetingIntelligenceObjectSchema = Joi.object({
  attendees: Joi.array().items(Joi.string().trim().max(120)).max(100).default([]),
  decisions: Joi.array().items(Joi.string().trim().max(500)).max(100).default([]),
  actionItems: Joi.array().items(Joi.string().trim().max(500)).max(100).default([]),
  blockers: Joi.array().items(Joi.string().trim().max(500)).max(100).default([]),
  risks: Joi.array().items(Joi.string().trim().max(500)).max(100).default([]),
  deadlines: Joi.array().items(Joi.string().trim().max(240)).max(100).default([]),
  followUps: Joi.array().items(Joi.string().trim().max(500)).max(100).default([]),
  executiveSummary: Joi.string().trim().max(2000).allow("").default(""),
  meetingType: Joi.string().trim().max(60).allow("").default(""),
  priorityLevel: Joi.string().trim().max(30).allow("").default("")
}).default({});

export const meetingFollowUpEmailSchema = Joi.object({
  body: Joi.object({
    noteId: objectId.optional(),
    meetingIntelligence: meetingIntelligenceObjectSchema.optional(),
    meetingContent: Joi.string().trim().max(12000).allow("").default("")
  })
    .or("noteId", "meetingIntelligence", "meetingContent")
    .required()
});
