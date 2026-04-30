import Joi from "joi";

export const createAnalyticsEventSchema = Joi.object({
  body: Joi.object({
    anonymousId: Joi.string().trim().max(120).allow(""),
    eventName: Joi.string().trim().max(80).required(),
    eventType: Joi.string().trim().max(40).required(),
    path: Joi.string().trim().max(300).allow(""),
    metadata: Joi.object().unknown(true).default({})
  }).required()
});
