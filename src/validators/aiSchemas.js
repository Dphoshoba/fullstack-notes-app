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
