import Joi from "joi";

const objectId = Joi.string().hex().length(24);
const optionalDate = Joi.alternatives().try(Joi.date(), Joi.string().trim().allow(""));
const meetingMetaSchema = Joi.object({
  meetingDate: optionalDate,
  attendees: Joi.array().items(Joi.string().trim().max(120)).max(100).default([]),
  agenda: Joi.string().trim().max(5000).allow("").default(""),
  decisions: Joi.string().trim().max(5000).allow("").default(""),
  actionItems: Joi.alternatives()
    .try(
      Joi.string().trim().max(5000).allow(""),
      Joi.array().items(
        Joi.object({
          text: Joi.string().trim().max(500).required(),
          owner: Joi.string().trim().max(120).allow("").default(""),
          dueDate: optionalDate,
          status: Joi.string().valid("open", "done").default("open")
        })
      ).max(100)
    )
    .default(""),
  followUpDate: optionalDate,
  sourceType: Joi.string().trim().max(60).allow("").default("")
}).default({});
const updateMeetingMetaSchema = Joi.object({
  meetingDate: optionalDate,
  attendees: Joi.array().items(Joi.string().trim().max(120)).max(100),
  agenda: Joi.string().trim().max(5000).allow(""),
  decisions: Joi.string().trim().max(5000).allow(""),
  actionItems: Joi.alternatives().try(
    Joi.string().trim().max(5000).allow(""),
    Joi.array().items(
      Joi.object({
        text: Joi.string().trim().max(500).required(),
        owner: Joi.string().trim().max(120).allow("").default(""),
        dueDate: optionalDate,
        status: Joi.string().valid("open", "done").default("open")
      })
    ).max(100)
  ),
  followUpDate: optionalDate,
  sourceType: Joi.string().trim().max(60).allow("")
});

export const listNotesSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().max(120).allow("").default(""),
    category: Joi.string().trim().max(60).allow("").default(""),
    noteType: Joi.string().valid("all", "standard", "meeting").default("all"),
    scope: Joi.string().valid("all", "private", "workspace").default("all"),
    starred: Joi.boolean(),
    pinned: Joi.boolean(),
    thisWeek: Joi.boolean()
  }).default()
});

export const noteIdSchema = Joi.object({
  params: Joi.object({
    id: objectId.required()
  }).required()
});

export const createNoteSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(1).max(120).required(),
    body: Joi.string().trim().min(1).max(10000).required(),
    tags: Joi.array().items(Joi.string().trim().min(1).max(30)).max(20).default([]),
    category: Joi.string().trim().min(1).max(60).default("General"),
    noteType: Joi.string().valid("standard", "meeting").default("standard"),
    meetingMeta: meetingMetaSchema,
    visibility: Joi.string().valid("private", "workspace").default("private"),
    starred: Joi.boolean().default(false),
    pinned: Joi.boolean().default(false)
  }).required()
});

export const updateNoteSchema = Joi.object({
  params: Joi.object({
    id: objectId.required()
  }).required(),
  body: Joi.object({
    title: Joi.string().trim().min(1).max(120),
    body: Joi.string().trim().min(1).max(10000),
    tags: Joi.array().items(Joi.string().trim().min(1).max(30)).max(20),
    category: Joi.string().trim().min(1).max(60),
    noteType: Joi.string().valid("standard", "meeting"),
    meetingMeta: updateMeetingMetaSchema,
    visibility: Joi.string().valid("private", "workspace"),
    starred: Joi.boolean(),
    pinned: Joi.boolean()
  })
    .min(1)
    .required()
});
