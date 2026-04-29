import { Router } from "express";

import {
  acceptWorkspaceInvite,
  addWorkspaceMember,
  createWorkspace,
  createWorkspaceInvite,
  getWorkspaceInvite,
  getMyWorkspace,
  listWorkspaceMembers
} from "../controllers/workspaceController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  addWorkspaceMemberSchema,
  createWorkspaceInviteSchema,
  createWorkspaceSchema,
  workspaceInviteTokenSchema
} from "../validators/workspaceSchemas.js";

const router = Router();

router.get("/invites/:token", validate(workspaceInviteTokenSchema), asyncHandler(getWorkspaceInvite));

router.use(authenticate);

router.post("/", validate(createWorkspaceSchema), asyncHandler(createWorkspace));
router.post("/invites", validate(createWorkspaceInviteSchema), asyncHandler(createWorkspaceInvite));
router.post(
  "/invites/:token/accept",
  validate(workspaceInviteTokenSchema),
  asyncHandler(acceptWorkspaceInvite)
);
router.get("/me", asyncHandler(getMyWorkspace));
router.get("/members", asyncHandler(listWorkspaceMembers));
router.post("/members", validate(addWorkspaceMemberSchema), asyncHandler(addWorkspaceMember));

export default router;
