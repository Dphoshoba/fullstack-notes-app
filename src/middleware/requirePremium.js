import { StatusCodes } from "http-status-codes";

import { ApiError } from "../utils/ApiError.js";

export const requirePremium = (feature = "this feature") => (req, _res, next) => {
  if ((req.user?.plan || "free") === "premium") {
    return next();
  }

  return next(
    new ApiError(
      StatusCodes.PAYMENT_REQUIRED,
      `Upgrade to Premium to use ${feature}.`
    )
  );
};
