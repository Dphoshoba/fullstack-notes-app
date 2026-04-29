import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const noteAttachmentsSchema = Joi.object({
  params: Joi.object({
    noteId: objectId.required()
  }).required()
});

export const attachmentIdSchema = Joi.object({
  params: Joi.object({
    id: objectId.required()
  }).required()
});
