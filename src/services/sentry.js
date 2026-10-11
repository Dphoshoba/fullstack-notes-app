import * as Sentry from "@sentry/node";

export const initSentry = () => {
  if (!process.env.SENTRY_DSN) {
    return false;
  }
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.2
  });
  return true;
};

export { Sentry };
