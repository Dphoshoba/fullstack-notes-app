import { Notification } from "../models/Notification.js";

export const createNotification = async (userIdOrInput, type, title, message, metadata = {}) => {
  const input =
    typeof userIdOrInput === "object" && userIdOrInput !== null
      ? userIdOrInput
      : { userId: userIdOrInput, type, title, message, metadata };

  if (!input.userId || !input.type || !input.title || !input.message) {
    return null;
  }

  return Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    metadata: input.metadata || {}
  });
};
