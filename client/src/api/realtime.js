import { io } from "socket.io-client";

import { API_BASE_URL } from "../config.js";
import { tokenStorage } from "./http.js";

let socket = null;

export function subscribeToNotifications({ onNotification, onError } = {}) {
  const token = tokenStorage.get();

  if (!token) {
    return () => {};
  }

  if (!socket || socket.disconnected) {
    socket = io(API_BASE_URL, {
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"]
    });
  } else {
    socket.auth = { token };
    socket.connect();
  }

  const handleNotification = (notification) => {
    onNotification?.(notification);
  };

  const handleError = (error) => {
    onError?.(error?.message || "Realtime connection failed");
  };

  socket.on("notification", handleNotification);
  socket.on("connect_error", handleError);

  return () => {
    socket?.off("notification", handleNotification);
    socket?.off("connect_error", handleError);
  };
}
