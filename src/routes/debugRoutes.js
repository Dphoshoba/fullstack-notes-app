import { Router } from "express";

import { env } from "../config/env.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { checkOpenAiTranscription } from "../services/aiService.js";
import { sendEmail } from "../services/emailService.js";

const router = Router();

const logAuthHeader = (req, _res, next) => {
  console.log("Auth header received:", Boolean(req.get("authorization")));
  next();
};

const logAuthenticatedUser = (req, _res, next) => {
  console.log("User authenticated:", req.user?.id);
  next();
};

router.post(
  "/send-test-email",
  logAuthHeader,
  authenticate,
  logAuthenticatedUser,
  asyncHandler(async (req, res) => {
    const { to } = req.body;

    console.log("RESEND_API_KEY exists:", Boolean(env.RESEND_API_KEY));
    console.log("EMAIL_FROM value:", env.EMAIL_FROM);

    try {
      const emailSent = await sendEmail({
        to,
        subject: "Test email from Notes Workspace",
        html: "<p>If you received this, Resend is working.</p>",
        text: "If you received this, Resend is working."
      });

      console.log("Resend response:", { emailSent });

      if (!emailSent) {
        throw new Error("Email service returned false");
      }

      return res.status(200).json({
        success: true,
        message: "Test email sent"
      });
    } catch (error) {
      console.warn("Test email failed:", error.message);

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
    console.log("OPENAI_API_KEY exists:", Boolean(env.OPENAI_API_KEY));

    const status = await checkOpenAiTranscription();
    console.log("OpenAI transcription status:", {
      success: status.success,
      apiKeyConfigured: status.apiKeyConfigured,
      details: status.details || null
    });

    return res.status(status.success ? 200 : 502).json(status);
  })
);

export default router;
