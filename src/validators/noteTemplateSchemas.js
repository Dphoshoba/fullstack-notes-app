import Joi from "joi";

export const createNoteTemplateSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(1).max(80).required(),
    noteType: Joi.string().valid("standard", "meeting").optional(),
    category: Joi.string().trim().max(60).optional(),
    title: Joi.string().trim().max(120).optional(),
    body: Joi.string().trim().max(10000).optional()
  })
});

export const noteTemplateIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  })
});
