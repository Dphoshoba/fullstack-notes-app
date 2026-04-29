import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const noteCommentsSchema = Joi.object({
  params: Joi.object({
    noteId: objectId.required()
  }).required()
});

export const createCommentSchema = Joi.object({
  params: Joi.object({
    noteId: objectId.required()
  }).required(),
  body: Joi.object({
    text: Joi.string().trim().min(1).max(2000).required()
  }).required()
});

export const updateCommentSchema = Joi.object({
  params: Joi.object({
    id: objectId.required()
  }).required(),
  body: Joi.object({
    text: Joi.string().trim().min(1).max(2000).required()
  }).required()
});

export const commentIdSchema = Joi.object({
  params: Joi.object({
    id: objectId.required()
  }).required()
});
