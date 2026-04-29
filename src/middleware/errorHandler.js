import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const formatMongooseValidation = (error) =>
  Object.values(error.errors).map((item) => ({
    field: item.path,
    message: item.message
  }));

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = error.message || "Internal server error";
  let details = error.details;

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Validation failed";
    details = formatMongooseValidation(error);
  }

  if (error instanceof mongoose.Error.CastError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Invalid resource identifier";
  }

  if (error?.code === 11000) {
    statusCode = StatusCodes.CONFLICT;
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    message = `${field} already exists`;
  }

  if (error?.code === "LIMIT_FILE_SIZE") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "File too large. Maximum size is 10MB.";
  }

  const response = {
    success: false,
    message
  };

  if (details) {
    response.details = details;
  }

  if (env.NODE_ENV !== "production" && !(error instanceof ApiError)) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};
