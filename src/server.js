import http from "http";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { logger } from "./services/logger.js";
import { initSentry } from "./services/sentry.js";
import { initRealtime } from "./services/realtime.js";

const startServer = async () => {
  initSentry();
  await connectDatabase();

  const server = http.createServer(app);
  initRealtime(server);

  server.listen(env.PORT, () => {
    logger.info(`API running on http://localhost:${env.PORT}`, { env: env.NODE_ENV });
  });
};

startServer().catch((error) => {
  logger.error("Failed to start server", { error: error?.message });
  process.exit(1);
});
