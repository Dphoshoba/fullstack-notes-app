import { Server } from "socket.io";

let io = null;

export const initRealtime = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN?.split(",") || ["http://localhost:5173"],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    socket.userToken = token;
    next();
  });

  io.on("connection", (socket) => {
    socket.on("subscribe:notifications", (userId) => {
      socket.join(`user:${userId}`);
    });
  });

  return io;
};

export const emitNotification = (userId, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit("notification", payload);
};
