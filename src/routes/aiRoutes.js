import { Router } from "express";

import {
  convertToMeetingMinutes,
  extractActionItems,
  extractAttendeesAndDecisions,
  smartInsights,
  suggestTags,
  summarizeNote
} from "../controllers/aiController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { enforceAiUsage } from "../middleware/enforceAiUsage.js";
import { validate } from "../middleware/validate.js";
import { noteAiSchema, smartInsightsSchema } from "../validators/aiSchemas.js";

const router = Router();

router.use(authenticate);
router.use(asyncHandler(enforceAiUsage));

router.post("/summarize-note", validate(noteAiSchema), asyncHandler(summarizeNote));
router.post("/suggest-tags", validate(noteAiSchema), asyncHandler(suggestTags));
router.post("/convert-to-meeting-minutes", validate(noteAiSchema), asyncHandler(convertToMeetingMinutes));
router.post("/extract-action-items", validate(noteAiSchema), asyncHandler(extractActionItems));
router.post("/extract-attendees-decisions", validate(noteAiSchema), asyncHandler(extractAttendeesAndDecisions));
router.post("/smart-insights", validate(smartInsightsSchema), asyncHandler(smartInsights));

export default router;
