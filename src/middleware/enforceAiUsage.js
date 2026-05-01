import { StatusCodes } from "http-status-codes";

import { AI_USAGE_LIMITS } from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { ApiError } from "../utils/ApiError.js";

const getPlanLimit = (plan) => AI_USAGE_LIMITS[plan] ?? AI_USAGE_LIMITS.free;

export const enforceAiUsage = async (req, res, next) => {
  const plan = req.user.plan || "free";
  const aiUsageCount = req.user.aiUsageCount || 0;
  const aiUsageLimit = getPlanLimit(plan);

  if (aiUsageCount >= aiUsageLimit) {
    const message =
      plan === "free"
        ? "Free AI limit reached. Upgrade to continue."
        : "AI usage limit reached.";
    await createNotification({
      userId: req.user.id,
      type: "ai_usage_limit_reached",
      title: "AI usage limit reached",
      message,
      metadata: {
        plan,
        aiUsageCount,
        aiUsageLimit
      }
    });
    return next(new ApiError(StatusCodes.FORBIDDEN, message));
  }

  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    if (res.statusCode < StatusCodes.BAD_REQUEST) {
      req.user.aiUsageCount = aiUsageCount + 1;
      req.user.aiUsageLimit = aiUsageLimit;
      await req.user.save();
    }

    return originalJson(body);
  };

  return next();
};
