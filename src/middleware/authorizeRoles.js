import { StatusCodes } from "http-status-codes";

import { ApiError } from "../utils/ApiError.js";

export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required"));
  }

  if (!roles.includes(req.user.role)) {
    return next(new ApiError(StatusCodes.FORBIDDEN, "You do not have permission for this action"));
  }

  return next();
};
