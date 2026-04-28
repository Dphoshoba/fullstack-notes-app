import { Router } from "express";

import {
  createCheckoutSession,
  createPortalSession,
  getBillingStatus,
  handleStripeWebhook
} from "../controllers/billingController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";

export const billingWebhookRouter = Router();

billingWebhookRouter.post("/", asyncHandler(handleStripeWebhook));

const router = Router();

router.use(authenticate);

router.post("/create-checkout-session", asyncHandler(createCheckoutSession));
router.post("/create-portal-session", asyncHandler(createPortalSession));
router.get("/status", asyncHandler(getBillingStatus));

export default router;
