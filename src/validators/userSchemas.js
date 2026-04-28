import Joi from "joi";

import { USER_ROLES } from "../models/User.js";

const objectId = Joi.string().hex().length(24);

export const updateCurrentUserSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).required()
  }).required()
});

export const updateUserSettingsSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80),
    preferredLanguage: Joi.string().trim().min(2).max(10),
    defaultNoteScope: Joi.string().valid("private", "workspace")
  })
    .min(1)
    .required()
});

export const updateUserRoleSchema = Joi.object({
  params: Joi.object({
    id: objectId.required()
  }).required(),
  body: Joi.object({
    role: Joi.string()
      .valid(...USER_ROLES)
      .required()
  }).required()
});
