import { Notification } from "../models/Notification.js";

export const createNotification = async ({ userId, type, message }) => {
  if (!userId || !type || !message) {
    return null;
  }

  return Notification.create({
    userId,
    type,
    message
  });
};
