import { StatusCodes } from "http-status-codes";
import { nanoid } from "nanoid";

import { env } from "../config/env.js";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { WorkspaceInvite } from "../models/WorkspaceInvite.js";
import { createNotification } from "../services/notificationService.js";
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

const getInviteLink = (token) => `${env.CLIENT_ORIGIN.split(",")[0]}/invite/${token}`;

const getValidInvite = async (token) => {
  const invite = await WorkspaceInvite.findOne({ token }).populate("workspaceId", "name slug");

  if (!invite) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Invite not found");
  }

  if (invite.status === "pending" && invite.expiresAt <= new Date()) {
    invite.status = "expired";
    await invite.save();
  }

  if (invite.status !== "pending") {
    throw new ApiError(StatusCodes.GONE, "Invite is no longer active");
  }

  return invite;
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

export const createWorkspaceInvite = async (req, res) => {
  if (!req.user.organizationId || !canManageMembers(req.user)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Workspace owner or manager required");
  }

  const token = nanoid(36);
  const invite = await WorkspaceInvite.create({
    workspaceId: req.user.organizationId,
    invitedEmail: req.body.email,
    invitedBy: req.user.id,
    workspaceRole: req.body.role,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      invite,
      inviteLink: getInviteLink(token)
    }
  });
};

export const getWorkspaceInvite = async (req, res) => {
  const invite = await getValidInvite(req.params.token);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      workspaceName: invite.workspaceId.name,
      invitedEmail: invite.invitedEmail,
      workspaceRole: invite.workspaceRole,
      expiresAt: invite.expiresAt
    }
  });
};

export const acceptWorkspaceInvite = async (req, res) => {
  const invite = await getValidInvite(req.params.token);

  if (req.user.email.toLowerCase() !== invite.invitedEmail) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Invite email does not match your account");
  }

  if (req.user.organizationId && req.user.organizationId.toString() !== invite.workspaceId.id) {
    throw new ApiError(StatusCodes.CONFLICT, "You already belong to another workspace");
  }

  req.user.organizationId = invite.workspaceId.id;
  req.user.workspaceRole = invite.workspaceRole;
  req.user.defaultNoteScope = "workspace";
  await req.user.save();

  await Organization.findByIdAndUpdate(invite.workspaceId.id, {
    $addToSet: { members: req.user.id }
  });

  invite.status = "accepted";
  await invite.save();

  if (invite.invitedBy.toString() !== req.user.id) {
    await createNotification({
      userId: invite.invitedBy,
      type: "workspace_invite_accepted",
      title: "Workspace invite accepted",
      message: `${req.user.name} accepted your workspace invite for ${invite.workspaceId.name}.`,
      metadata: {
        workspaceId: invite.workspaceId.id,
        acceptedBy: req.user.id
      }
    });
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      workspace: invite.workspaceId,
      role: req.user.workspaceRole
    }
  });
};
