import rateLimit from "express-rate-limit";

const rateLimitMessage = "Too many requests. Please wait a moment and try again.";

const createLimiter = ({ limit, windowMs }) =>
  rateLimit({
    windowMs,
    limit,
    message: {
      success: false,
      message: rateLimitMessage
    },
    standardHeaders: "draft-7",
    legacyHeaders: false
  });

export const globalLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 1000
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30
});

export const billingLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 60
});

export const uploadLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 80
});
