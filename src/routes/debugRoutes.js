import { Router } from "express";

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

export default router;
