import { Router } from "express";

import { createAnalyticsEvent, getAnalyticsSummary } from "../controllers/analyticsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { optionalAuthenticate } from "../middleware/optionalAuthenticate.js";
import { validate } from "../middleware/validate.js";
import { createAnalyticsEventSchema } from "../validators/analyticsSchemas.js";

const router = Router();

router.post(
  "/events",
  optionalAuthenticate,
  validate(createAnalyticsEventSchema),
  asyncHandler(createAnalyticsEvent)
);

router.get(
  "/summary",
  authenticate,
  authorizeRoles("admin", "superadmin"),
  asyncHandler(getAnalyticsSummary)
);

export default router;
