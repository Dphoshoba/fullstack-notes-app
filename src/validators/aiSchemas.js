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
