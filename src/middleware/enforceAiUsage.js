import { StatusCodes } from "http-status-codes";

import { ApiError } from "../utils/ApiError.js";

export const enforceAiUsage = async (req, _res, next) => {
  const plan = req.user.plan || "free";
  const aiUsageCount = req.user.aiUsageCount || 0;
  const aiUsageLimit = req.user.aiUsageLimit ?? 20;

  if (plan === "free" && aiUsageCount >= aiUsageLimit) {
    return next(new ApiError(StatusCodes.TOO_MANY_REQUESTS, "AI usage limit reached"));
  }

  req.user.aiUsageCount = aiUsageCount + 1;
  await req.user.save();
  return next();
};
