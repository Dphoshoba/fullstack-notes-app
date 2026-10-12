import { Notification } from "../models/Notification.js";
import { emitNotification } from "./realtime.js";

export const createNotification = async (userIdOrInput, type, title, message, metadata = {}) => {
  const input =
    typeof userIdOrInput === "object" && userIdOrInput !== null
      ? userIdOrInput
      : { userId: userIdOrInput, type, title, message, metadata };

  if (!input.userId || !input.type || !input.title || !input.message) {
    return null;
  }

  const notification = await Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    metadata: input.metadata || {}
  });

  emitNotification(String(input.userId), {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    metadata: notification.metadata,
    read: notification.read,
    createdAt: notification.createdAt
  });

  return notification;
};

