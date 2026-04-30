import { Router } from "express";

import { listNotifications, markNotificationRead } from "../controllers/notificationController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { notificationIdSchema } from "../validators/notificationSchemas.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(listNotifications));
router.patch("/:id/read", validate(notificationIdSchema), asyncHandler(markNotificationRead));

export default router;
