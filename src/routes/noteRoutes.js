import { Router } from "express";

import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote
} from "../controllers/noteController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createNoteSchema,
  listNotesSchema,
  noteIdSchema,
  updateNoteSchema
} from "../validators/noteSchemas.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listNotesSchema), asyncHandler(listNotes));
router.post("/", validate(createNoteSchema), asyncHandler(createNote));
router.get("/:id", validate(noteIdSchema), asyncHandler(getNote));
router.put("/:id", validate(updateNoteSchema), asyncHandler(updateNote));
router.patch("/:id", validate(updateNoteSchema), asyncHandler(updateNote));
router.delete("/:id", validate(noteIdSchema), asyncHandler(deleteNote));

export default router;
