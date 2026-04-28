import { StatusCodes } from "http-status-codes";
import { nanoid } from "nanoid";

import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

const canManageMembers = (user) => ["owner", "manager"].includes(user.workspaceRole);

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const getWorkspace = async (user) => {
  if (!user.organizationId) {
    return null;
  }

  return Organization.findById(user.organizationId);
};

export const createWorkspace = async (req, res) => {
  if (req.user.organizationId) {
    throw new ApiError(StatusCodes.CONFLICT, "You already belong to a workspace");
  }

  const baseSlug = slugify(req.body.name) || "workspace";
  const organization = await Organization.create({
    name: req.body.name,
    slug: `${baseSlug}-${nanoid(6).toLowerCase()}`,
    owner: req.user.id,
    members: [req.user.id]
  });

  req.user.organizationId = organization.id;
  req.user.workspaceRole = "owner";
  req.user.defaultNoteScope = "workspace";
  await req.user.save();

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      workspace: organization,
      role: req.user.workspaceRole
    }
  });
};

export const getMyWorkspace = async (req, res) => {
  const workspace = await getWorkspace(req.user);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      workspace,
      role: req.user.workspaceRole || "staff"
    }
  });
};

export const listWorkspaceMembers = async (req, res) => {
  if (!req.user.organizationId || !canManageMembers(req.user)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Workspace owner or manager required");
  }

  const members = await User.find({ organizationId: req.user.organizationId }).sort({
    workspaceRole: 1,
    name: 1
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    data: members
  });
};

export const addWorkspaceMember = async (req, res) => {
  if (!req.user.organizationId || !canManageMembers(req.user)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Workspace owner or manager required");
  }

  let member = await User.findOne({ email: req.body.email });

  if (member?.organizationId && member.organizationId.toString() !== req.user.organizationId.toString()) {
    throw new ApiError(StatusCodes.CONFLICT, "User already belongs to another workspace");
  }

  if (!member) {
    member = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: nanoid(18),
      organizationId: req.user.organizationId,
      workspaceRole: req.body.role,
      defaultNoteScope: "workspace"
    });
  } else {
    member.name = req.body.name;
    member.organizationId = req.user.organizationId;
    member.workspaceRole = req.body.role;
    await member.save();
  }

  await Organization.findByIdAndUpdate(req.user.organizationId, {
    $addToSet: { members: member.id }
  });

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: member
  });
};
