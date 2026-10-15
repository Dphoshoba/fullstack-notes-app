import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

/**
 * @typedef {import("jsonwebtoken").JwtPayload & {
 *   sub: string,
 *   email?: string,
 *   role?: string,
 *   jti?: string
 * }} AppJwtPayload
 */

export const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: /** @type {any} */ (env.ACCESS_TOKEN_EXPIRES_IN) }
  );

export const signRefreshToken = (user, tokenId) =>
  jwt.sign(
    {
      sub: user.id,
      jti: tokenId
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: /** @type {any} */ (env.REFRESH_TOKEN_EXPIRES_IN) }
  );

const verifyTokenPayload = (token, secret) => {
  const payload = jwt.verify(token, secret);

  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Invalid token payload");
  }

  return /** @type {AppJwtPayload} */ (payload);
};

export const verifyAccessToken = (token) => verifyTokenPayload(token, env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) => verifyTokenPayload(token, env.JWT_REFRESH_SECRET);
