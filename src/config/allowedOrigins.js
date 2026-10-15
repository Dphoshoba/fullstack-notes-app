import { env } from "./env.js";

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5173",
  "https://notes-app-multilingual.netlify.app"
];

const defaultOriginPatterns = [
  /^https:\/\/[a-z0-9-]+--notes-app-multilingual\.netlify\.app$/i
];

const normalizeOrigin = (origin = "") => origin.trim().replace(/\/+$/, "");

const splitOrigins = (origins = "") =>
  origins
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

export const allowedOrigins = Array.from(
  new Set([
    ...defaultOrigins.map(normalizeOrigin),
    ...splitOrigins(env.CLIENT_ORIGIN),
    ...splitOrigins(process.env.ADDITIONAL_CLIENT_ORIGINS || "")
  ])
);

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = normalizeOrigin(origin);
  return (
    allowedOrigins.includes(normalizedOrigin) ||
    defaultOriginPatterns.some((pattern) => pattern.test(normalizedOrigin))
  );
};
