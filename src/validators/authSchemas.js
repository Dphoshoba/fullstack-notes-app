import Joi from "joi";

const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[a-z]/, "lowercase letter")
  .pattern(/[A-Z]/, "uppercase letter")
  .pattern(/[0-9]/, "number")
  .required();

export const registerSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().lowercase().email().max(120).required(),
    password
  }).required()
});

export const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().required()
  }).required()
});
