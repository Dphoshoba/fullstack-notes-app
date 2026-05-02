import { StatusCodes } from "http-status-codes";
import { nanoid } from "nanoid";

import { Organization } from "../models/Organization.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import {
  clearRefreshTokenCookie,
  refreshCookieName,
  setRefreshTokenCookie
} from "../utils/cookies.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";

const refreshTokenDays = 7;

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const createTokenPair = async (user) => {
  const tokenId = nanoid();
  const expiresAt = new Date(Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    tokenId,
    user: user.id,
    expiresAt
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user, tokenId)
  };
};

const sendAuthResponse = async (res, user, statusCode = StatusCodes.OK, workspace = null) => {
  const tokens = await createTokenPair(user);
  setRefreshTokenCookie(res, tokens.refreshToken);

  return res.status(statusCode).json({
    success: true,
    user,
    workspace,
    accessToken: tokens.accessToken
  });
};

export const register = async (req, res) => {
  const user = await User.create(req.body);
  const workspaceName = `${user.name}'s Workspace`;
  const baseSlug = slugify(workspaceName) || "workspace";
  const workspace = await Organization.create({
    name: workspaceName,
    slug: `${baseSlug}-${nanoid(6).toLowerCase()}`,
    owner: user.id,
    members: [user.id]
  });

  user.organizationId = workspace.id;
  user.workspaceRole = "owner";
  user.defaultNoteScope = "workspace";
  await user.save();

  return sendAuthResponse(res, user, StatusCodes.CREATED, workspace);
};

export const login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+password");

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  return sendAuthResponse(res, user);
};

export const refresh = async (req, res) => {
  const token = req.cookies?.[refreshCookieName];

  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Missing refresh token");
  }

  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshTokenCookie(res);
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const storedToken = await RefreshToken.findOne({
    tokenId: payload.jti,
    user: payload.sub,
    revokedAt: null
  });

  if (!storedToken || storedToken.expiresAt <= new Date()) {
    clearRefreshTokenCookie(res);
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token has been revoked");
  }

  storedToken.revokedAt = new Date();
  await storedToken.save();

  const user = await User.findById(payload.sub);

  if (!user) {
    clearRefreshTokenCookie(res);
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User no longer exists");
  }

  return sendAuthResponse(res, user);
};

export const logout = async (req, res) => {
  const token = req.cookies?.[refreshCookieName];

  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await RefreshToken.findOneAndUpdate(
        { tokenId: payload.jti, user: payload.sub, revokedAt: null },
        { revokedAt: new Date() }
      );
    } catch {
      // Logout should be idempotent even when the cookie is stale.
    }
  }

  clearRefreshTokenCookie(res);
  return res.status(StatusCodes.OK).json({ success: true, message: "Logged out" });
};

export const me = async (req, res) => {
  return res.status(StatusCodes.OK).json({
    success: true,
    user: req.user
  });
};
