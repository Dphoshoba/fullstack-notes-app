import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { authLimiter, billingLimiter, globalLimiter, uploadLimiter } from "./middleware/rateLimiters.js";
import { requestLogger } from "./middleware/requestLogger.js";
import aiRoutes from "./routes/aiRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import billingRoutes, { billingWebhookRouter } from "./routes/billingRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";

const app = express();
const allowedOrigins = env.CLIENT_ORIGIN.split(",");

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);
app.use("/api/billing/webhook", express.raw({ type: "application/json" }), billingWebhookRouter);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

app.use(globalLimiter);

app.use("/api/health", healthRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/attachments", uploadLimiter, attachmentRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/billing", billingLimiter, billingRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
