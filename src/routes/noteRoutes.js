import { Router } from "express";

import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote
} from "../controllers/noteController.js";
import { createComment, listComments } from "../controllers/commentController.js";
import { createAttachment, listAttachments } from "../controllers/attachmentController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createNoteSchema,
  listNotesSchema,
  noteIdSchema,
  updateNoteSchema
} from "../validators/noteSchemas.js";
import { createCommentSchema, noteCommentsSchema } from "../validators/commentSchemas.js";
import { noteAttachmentsSchema } from "../validators/attachmentSchemas.js";
import { uploadAttachment } from "../middleware/uploadAttachment.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listNotesSchema), asyncHandler(listNotes));
router.post("/", validate(createNoteSchema), asyncHandler(createNote));
router.get("/:noteId/comments", validate(noteCommentsSchema), asyncHandler(listComments));
router.post("/:noteId/comments", validate(createCommentSchema), asyncHandler(createComment));
router.get("/:noteId/attachments", validate(noteAttachmentsSchema), asyncHandler(listAttachments));
router.post(
  "/:noteId/attachments",
  validate(noteAttachmentsSchema),
  uploadAttachment.single("file"),
  asyncHandler(createAttachment)
);
router.get("/:id", validate(noteIdSchema), asyncHandler(getNote));
router.put("/:id", validate(updateNoteSchema), asyncHandler(updateNote));
router.patch("/:id", validate(updateNoteSchema), asyncHandler(updateNote));
router.delete("/:id", validate(noteIdSchema), asyncHandler(deleteNote));

export default router;
