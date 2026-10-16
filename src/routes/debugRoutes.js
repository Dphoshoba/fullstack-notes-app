import { Router } from "express";
import Stripe from "stripe";

import { env } from "../config/env.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { checkOpenAiTranscription } from "../services/aiService.js";
import { sendEmail } from "../services/emailService.js";
import { logger } from "../services/logger.js";

const router = Router();

const logAuthHeader = (req, _res, next) => {
  logger.info("Debug auth header received", { hasAuthorization: Boolean(req.get("authorization")) });
  next();
};

const logAuthenticatedUser = (req, _res, next) => {
  logger.info("Debug user authenticated", { userId: req.user?.id });
  next();
};

router.post(
  "/send-test-email",
  logAuthHeader,
  authenticate,
  logAuthenticatedUser,
  asyncHandler(async (req, res) => {
    const { to } = req.body;

    logger.info("Debug email configuration", {
      resendConfigured: Boolean(env.RESEND_API_KEY),
      emailFromConfigured: Boolean(env.EMAIL_FROM)
    });

    try {
      const emailSent = await sendEmail({
        to,
        subject: "Test email from Notes Workspace",
        html: "<p>If you received this, Resend is working.</p>",
        text: "If you received this, Resend is working."
      });

      logger.info("Debug email send response", { emailSent });

      if (!emailSent) {
        throw new Error("Email service returned false");
      }

      return res.status(200).json({
        success: true,
        message: "Test email sent"
      });
    } catch (error) {
      logger.warn("Debug test email failed", { error: error.message });

      return res.status(500).json({
        success: false,
        message: "Test email failed",
        error: error.message
      });
    }
  })
);

router.post(
  "/openai-transcription-status",
  logAuthHeader,
  authenticate,
  logAuthenticatedUser,
  asyncHandler(async (_req, res) => {
    logger.info("Debug OpenAI configuration", { openAiConfigured: Boolean(env.OPENAI_API_KEY) });

    const status = await checkOpenAiTranscription();
    logger.info("OpenAI transcription debug status", {
      success: status.success,
      apiKeyConfigured: status.apiKeyConfigured,
      hasDetails: Boolean(status.details)
    });

    return res.status(status.success ? 200 : 502).json(status);
  })
);

router.post(
  "/stripe-price-status",
  logAuthHeader,
  authenticate,
  logAuthenticatedUser,
  asyncHandler(async (_req, res) => {
    const secretKeyMode = env.STRIPE_SECRET_KEY.startsWith("sk_live_")
      ? "live"
      : env.STRIPE_SECRET_KEY.startsWith("sk_test_")
        ? "test"
        : "unknown";
    const priceId = env.STRIPE_PRICE_ID || "";

    logger.info("Debug Stripe configuration", {
      stripeSecretConfigured: Boolean(env.STRIPE_SECRET_KEY),
      stripeSecretMode: secretKeyMode,
      stripePriceConfigured: Boolean(priceId),
      stripePricePrefix: priceId.slice(0, 6),
      stripePriceSuffix: priceId.slice(-6)
    });

    if (!env.STRIPE_SECRET_KEY || !priceId) {
      return res.status(400).json({
        success: false,
        message: "Stripe secret key or price ID is missing",
        stripeSecretMode: secretKeyMode,
        priceConfigured: Boolean(priceId)
      });
    }

    try {
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      const price = await stripe.prices.retrieve(priceId);

      return res.status(200).json({
        success: true,
        message: "Stripe price retrieved",
        stripeSecretMode: secretKeyMode,
        price: {
          idPrefix: price.id.slice(0, 6),
          idSuffix: price.id.slice(-6),
          active: price.active,
          livemode: price.livemode,
          currency: price.currency,
          unitAmount: price.unit_amount,
          recurringInterval: price.recurring?.interval || null,
          productId: typeof price.product === "string" ? price.product : price.product?.id || ""
        }
      });
    } catch (error) {
      logger.warn("Debug Stripe price retrieval failed", {
        stripeSecretMode: secretKeyMode,
        priceIdPrefix: priceId.slice(0, 6),
        priceIdSuffix: priceId.slice(-6),
        errorType: error.type,
        errorCode: error.code,
        errorMessage: error.message
      });

      return res.status(502).json({
        success: false,
        message: "Stripe price could not be retrieved",
        stripeSecretMode: secretKeyMode,
        priceIdPrefix: priceId.slice(0, 6),
        priceIdSuffix: priceId.slice(-6),
        errorType: error.type,
        errorCode: error.code,
        error: error.message
      });
    }
  })
);

export default router;
