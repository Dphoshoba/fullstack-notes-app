import mongoose from "mongoose";

import { env } from "./env.js";
import { logger } from "../services/logger.js";

export const connectDatabase = async () => {
  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(env.MONGODB_URI);
  logger.info("MongoDB connected", { host: connection.connection.host });

  return connection;
};
