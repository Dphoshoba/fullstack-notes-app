import { StatusCodes } from "http-status-codes";

import { Organization } from "../models/Organization.js";
import { AI_USAGE_LIMITS, User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

const getUsageLimit = (plan) => AI_USAGE_LIMITS[plan] ?? AI_USAGE_LIMITS.free;

export const listUsers = async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });

  return res.status(StatusCodes.OK).json({
    success: true,
    data: users
  });
};

export const getCurrentUser = async (req, res) => {
  return res.status(StatusCodes.OK).json({
    success: true,
    data: req.user
  });
};

export const getUserSettings = async (req, res) => {
  const workspace = req.user.organizationId
    ? await Organization.findById(req.user.organizationId)
    : null;

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      user: req.user,
      workspace
    }
  });
};

export const getUsage = async (req, res) => {
  const plan = req.user.plan || "free";
  const aiUsageCount = req.user.aiUsageCount || 0;
  const aiUsageLimit = getUsageLimit(plan);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      plan,
      aiUsageCount,
      aiUsageLimit,
      remainingAiUses: Math.max(aiUsageLimit - aiUsageCount, 0)
    }
  });
};

export const updateCurrentUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name: req.body.name },
    {
      new: true,
      runValidators: true
    }
  );

  return res.status(StatusCodes.OK).json({
    success: true,
    data: user
  });
};

export const updateUserSettings = async (req, res) => {
  if (req.body.defaultNoteScope === "workspace" && !req.user.organizationId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Create or join a workspace first");
  }

  const allowedUpdates = {};

  for (const key of ["name", "preferredLanguage", "defaultNoteScope"]) {
    if (req.body[key] !== undefined) {
      allowedUpdates[key] = req.body[key];
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, allowedUpdates, {
    new: true,
    runValidators: true
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    data: user
  });
};

export const updateUserRole = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: user
  });
};
