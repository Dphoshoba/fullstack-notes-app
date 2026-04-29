import { Router } from "express";

import { deleteAttachment, downloadAttachment } from "../controllers/attachmentController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { attachmentIdSchema } from "../validators/attachmentSchemas.js";

const router = Router();

router.use(authenticate);

router.get("/:fileName", asyncHandler(downloadAttachment));
router.delete("/:id", validate(attachmentIdSchema), asyncHandler(deleteAttachment));

export default router;
