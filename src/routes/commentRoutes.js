import { Router } from "express";

import { deleteComment, updateComment } from "../controllers/commentController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { commentIdSchema, updateCommentSchema } from "../validators/commentSchemas.js";

const router = Router();

router.use(authenticate);

router.patch("/:id", validate(updateCommentSchema), asyncHandler(updateComment));
router.delete("/:id", validate(commentIdSchema), asyncHandler(deleteComment));

export default router;
