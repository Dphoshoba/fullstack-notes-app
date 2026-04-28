import { StatusCodes } from "http-status-codes";

import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

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

export const getUsage = async (req, res) => {
  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      plan: req.user.plan || "free",
      aiUsageCount: req.user.aiUsageCount || 0,
      aiUsageLimit: req.user.aiUsageLimit ?? 20
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
