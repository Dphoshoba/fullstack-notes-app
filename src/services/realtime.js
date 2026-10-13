import { Server } from "socket.io";

import { User } from "../models/User.js";
import { verifyAccessToken } from "../utils/tokens.js";

let io = null;

export const initRealtime = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN?.split(",") || ["http://localhost:5173"],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));

    try {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select("_id");

      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.userId = user._id.toString();
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on("subscribe:notifications", (userId) => {
      if (userId === socket.userId) {
        socket.join(`user:${userId}`);
      }
    });
  });

  return io;
};

export const emitNotification = (userId, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit("notification", payload);
};
