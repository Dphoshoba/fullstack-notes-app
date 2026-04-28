import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const listNotesSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().max(120).allow("").default(""),
    category: Joi.string().trim().max(60).allow("").default(""),
    scope: Joi.string().valid("all", "private", "workspace").default("all"),
    starred: Joi.boolean(),
    pinned: Joi.boolean()
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
    visibility: Joi.string().valid("private", "workspace"),
    starred: Joi.boolean(),
    pinned: Joi.boolean()
  })
    .min(1)
    .required()
});
