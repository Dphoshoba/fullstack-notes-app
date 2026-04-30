import fs from "node:fs/promises";
import path from "node:path";

import { StatusCodes } from "http-status-codes";

import { Attachment } from "../models/Attachment.js";
import { Note } from "../models/Note.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadsDir } from "../middleware/uploadAttachment.js";

const canManageWorkspace = (user) => ["owner", "manager"].includes(user.workspaceRole);

const isWorkspaceMemberForNote = (user, note) =>
  user.organizationId &&
  note.organizationId &&
  user.organizationId.toString() === note.organizationId.toString();

const getAccessibleNote = async (user, noteId) => {
  const note = await Note.findById(noteId);

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

  const visibility = note.visibility || "private";
  const isOwner = note.owner.toString() === user.id;

  if (visibility === "private" && !isOwner) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only the note owner can access private note attachments");
  }

  if (visibility === "workspace" && !isWorkspaceMemberForNote(user, note)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only workspace members can access these attachments");
  }

  return note;
};

const removeUploadedFile = async (fileName) => {
  await fs.unlink(path.join(uploadsDir, fileName)).catch(() => {});
};

const safeStoredFileName = (fileName) => {
  const normalized = path.basename(fileName || "");

  if (!normalized || normalized !== fileName) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid attachment file name");
  }

  return normalized;
};

export const listAttachments = async (req, res) => {
  await getAccessibleNote(req.user, req.params.noteId);

  const attachments = await Attachment.find({ noteId: req.params.noteId })
    .populate("uploadedBy", "name email")
    .sort({ createdAt: -1 });

  return res.status(StatusCodes.OK).json({
    success: true,
    data: attachments
  });
};

export const createAttachment = async (req, res) => {
  const note = await getAccessibleNote(req.user, req.params.noteId);

  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Upload a file to attach");
  }

  const attachment = await Attachment.create({
    noteId: note.id,
    uploadedBy: req.user.id,
    originalName: req.file.originalname,
    fileName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/api/attachments/${req.file.filename}`
  });
  await attachment.populate("uploadedBy", "name email");

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: attachment
  });
};

export const downloadAttachment = async (req, res) => {
  const fileName = safeStoredFileName(req.params.fileName);
  const attachment = await Attachment.findOne({ fileName });

  if (!attachment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Attachment not found");
  }

  await getAccessibleNote(req.user, attachment.noteId);

  return res.download(path.join(uploadsDir, attachment.fileName), attachment.originalName);
};

export const deleteAttachment = async (req, res) => {
  const attachment = await Attachment.findById(req.params.id);

  if (!attachment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Attachment not found");
  }

  const note = await getAccessibleNote(req.user, attachment.noteId);
  const isUploader = attachment.uploadedBy.toString() === req.user.id;
  const isNoteOwner = note.owner.toString() === req.user.id;
  const canDeleteAsManager = (note.visibility || "private") === "workspace" && canManageWorkspace(req.user);

  if (!isUploader && !isNoteOwner && !canDeleteAsManager) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission to delete this attachment");
  }

  await removeUploadedFile(attachment.fileName);
  await attachment.deleteOne();

  return res.status(StatusCodes.NO_CONTENT).send();
};
