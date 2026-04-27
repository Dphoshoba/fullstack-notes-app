import { env } from "../config/env.js";

const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

export const refreshCookieName = "refreshToken";

export const setRefreshTokenCookie = (res, token) => {
  res.cookie(refreshCookieName, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? "none" : "lax",
    maxAge: sevenDaysInMs,
    path: "/api/auth"
  });
};

export const clearRefreshTokenCookie = (res) => {
  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? "none" : "lax",
    path: "/api/auth"
  });
};
