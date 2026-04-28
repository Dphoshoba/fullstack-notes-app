import { Router } from "express";

import {
  addWorkspaceMember,
  createWorkspace,
  getMyWorkspace,
  listWorkspaceMembers
} from "../controllers/workspaceController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  addWorkspaceMemberSchema,
  createWorkspaceSchema
} from "../validators/workspaceSchemas.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createWorkspaceSchema), asyncHandler(createWorkspace));
router.get("/me", asyncHandler(getMyWorkspace));
router.get("/members", asyncHandler(listWorkspaceMembers));
router.post("/members", validate(addWorkspaceMemberSchema), asyncHandler(addWorkspaceMember));

export default router;
