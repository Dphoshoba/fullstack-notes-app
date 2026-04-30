import { StatusCodes } from "http-status-codes";

import { Notification } from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";

export const listNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: notifications
  });
};

export const markNotificationRead = async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!notification) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Notification not found");
  }

  notification.read = true;
  await notification.save();

  return res.status(StatusCodes.OK).json({
    success: true,
    data: notification
  });
};
