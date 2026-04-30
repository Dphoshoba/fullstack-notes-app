import dotenv from "dotenv";

dotenv.config();

const required = ["MONGODB_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
const placeholderValues = new Set([
  "replace-with-a-long-random-access-secret",
  "replace-with-a-long-random-refresh-secret"
]);

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (process.env.NODE_ENV === "production") {
  for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
    if (placeholderValues.has(process.env[key]) || process.env[key].length < 32) {
      throw new Error(`${key} must be a unique production secret with at least 32 characters`);
    }
  }

  if (process.env.COOKIE_SECURE !== "true") {
    throw new Error("COOKIE_SECURE must be true in production");
  }
}

const configuredStripeKeys = ["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID", "STRIPE_WEBHOOK_SECRET"].filter(
  (key) => Boolean(process.env[key])
);

if (configuredStripeKeys.length > 0 && configuredStripeKeys.length < 3) {
  throw new Error("Stripe configuration is incomplete. Set STRIPE_SECRET_KEY, STRIPE_PRICE_ID, and STRIPE_WEBHOOK_SECRET together.");
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true"
};
