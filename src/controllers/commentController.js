import { StatusCodes } from "http-status-codes";

import { Comment } from "../models/Comment.js";
import { Note } from "../models/Note.js";
import { createNotification } from "../services/notificationService.js";
import { ApiError } from "../utils/ApiError.js";

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
    throw new ApiError(StatusCodes.FORBIDDEN, "Only the note owner can comment on private notes");
  }

  if (visibility === "workspace" && !isWorkspaceMemberForNote(user, note)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only workspace members can comment on this note");
  }

  return note;
};

const getCommentWithNote = async (user, commentId) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found");
  }

  const note = await getAccessibleNote(user, comment.noteId);
  return { comment, note };
};

export const listComments = async (req, res) => {
  await getAccessibleNote(req.user, req.params.noteId);

  const comments = await Comment.find({ noteId: req.params.noteId })
    .populate("userId", "name email")
    .sort({ createdAt: 1 });

  return res.status(StatusCodes.OK).json({
    success: true,
    data: comments
  });
};

export const createComment = async (req, res) => {
  const note = await getAccessibleNote(req.user, req.params.noteId);

  const comment = await Comment.create({
    noteId: note.id,
    userId: req.user.id,
    text: req.body.text
  });
  await comment.populate("userId", "name email");

  if (note.owner.toString() !== req.user.id) {
    await createNotification({
      userId: note.owner,
      type: "new_comment",
      message: `${req.user.name} commented on "${note.title}".`
    });
  }

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: comment
  });
};

export const updateComment = async (req, res) => {
  const { comment } = await getCommentWithNote(req.user, req.params.id);

  if (comment.userId.toString() !== req.user.id) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only edit your own comments");
  }

  comment.text = req.body.text;
  await comment.save();
  await comment.populate("userId", "name email");

  return res.status(StatusCodes.OK).json({
    success: true,
    data: comment
  });
};

export const deleteComment = async (req, res) => {
  const { comment, note } = await getCommentWithNote(req.user, req.params.id);
  const ownsComment = comment.userId.toString() === req.user.id;
  const canDeleteAnyWorkspaceComment =
    (note.visibility || "private") === "workspace" && canManageWorkspace(req.user);

  if (!ownsComment && !canDeleteAnyWorkspaceComment) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission to delete this comment");
  }

  await comment.deleteOne();
  return res.status(StatusCodes.NO_CONTENT).send();
};
