import { StatusCodes } from "http-status-codes";

import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(
    {
      body: req.body,
      params: req.params,
      query: req.query
    },
    {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    }
  );

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message
    }));

    return next(new ApiError(StatusCodes.BAD_REQUEST, "Validation failed", details));
  }

  req.body = value.body || {};
  req.params = value.params || {};
  req.query = value.query || {};
  return next();
};
