import Joi from "joi";

export const createWorkspaceSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
  }).required()
});

export const addWorkspaceMemberSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().lowercase().email().max(120).required(),
    role: Joi.string().valid("staff", "manager").default("staff")
  }).required()
});

export const createWorkspaceInviteSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().max(120).required(),
    role: Joi.string().valid("staff", "manager").default("staff")
  }).required()
});

export const workspaceInviteTokenSchema = Joi.object({
  params: Joi.object({
    token: Joi.string().trim().min(12).max(120).required()
  }).required()
});
