import { StatusCodes } from "http-status-codes";

import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { asyncHandler } from "./asyncHandler.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Missing bearer token");
  }

  const token = header.slice("Bearer ".length);
  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired access token");
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User no longer exists");
  }

  req.user = user;
  return next();
});
