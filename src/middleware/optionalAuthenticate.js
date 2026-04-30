import { User } from "../models/User.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { asyncHandler } from "./asyncHandler.js";

export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const header = req.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (user) {
      req.user = user;
    }
  } catch {
    // Analytics should never block anonymous visitors because of an expired token.
  }

  return next();
});
