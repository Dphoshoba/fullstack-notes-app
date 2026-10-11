import { Router } from "express";

import {
  createTemplate,
  deleteTemplate,
  listTemplates
} from "../controllers/noteTemplateController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createNoteTemplateSchema,
  noteTemplateIdSchema
} from "../validators/noteTemplateSchemas.js";

const router = Router();

router.use(authenticate);
router.get("/", asyncHandler(listTemplates));
router.post("/", validate(createNoteTemplateSchema), asyncHandler(createTemplate));
router.delete("/:id", validate(noteTemplateIdSchema), asyncHandler(deleteTemplate));

export default router;
