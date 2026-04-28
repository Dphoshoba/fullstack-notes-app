import { Router } from "express";

import {
  getCurrentUser,
  getUsage,
  listUsers,
  updateCurrentUser,
  updateUserRole
} from "../controllers/userController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validate } from "../middleware/validate.js";
import { updateCurrentUserSchema, updateUserRoleSchema } from "../validators/userSchemas.js";

const router = Router();

router.use(authenticate);

router.get("/me", asyncHandler(getCurrentUser));
router.get("/usage", asyncHandler(getUsage));
router.patch("/me", validate(updateCurrentUserSchema), asyncHandler(updateCurrentUser));
router.get("/", authorizeRoles("admin", "superadmin"), asyncHandler(listUsers));
router.patch(
  "/:id/role",
  authorizeRoles("superadmin"),
  validate(updateUserRoleSchema),
  asyncHandler(updateUserRole)
);

export default router;
