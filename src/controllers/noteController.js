import { StatusCodes } from "http-status-codes";

import { Attachment } from "../models/Attachment.js";
import { Comment } from "../models/Comment.js";
import { Note } from "../models/Note.js";
import { ApiError } from "../utils/ApiError.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const canManageWorkspaceNote = (user) => ["owner", "manager"].includes(user.workspaceRole);

const userWorkspaceId = (user) => user.organizationId?.toString();

const serializeNote = (note) => {
  const { _id, ...noteData } = note;
  delete noteData.__v;

  return {
    ...noteData,
    id: _id.toString()
  };
};

const buildVisibilityFilter = (user, scope = "all") => {
  const privateFilter = {
    owner: user.id,
    $or: [{ visibility: "private" }, { visibility: { $exists: false } }]
  };
  const workspaceId = userWorkspaceId(user);
  const workspaceFilter = workspaceId
    ? { visibility: "workspace", organizationId: user.organizationId }
    : null;

  if (scope === "private" || !workspaceFilter) {
    return privateFilter;
  }

  if (scope === "workspace") {
    return workspaceFilter;
  }

  return { $or: [privateFilter, workspaceFilter] };
};

const buildNoteFilter = (user, query) => {
  const filter = buildVisibilityFilter(user, query.scope);

  if (query.search) {
    const searchRegex = new RegExp(escapeRegex(query.search), "i");
    filter.$and = [
      ...(filter.$and || []),
      { $or: [{ title: searchRegex }, { body: searchRegex }, { tags: searchRegex }] }
    ];
  }

  if (query.category) {
    filter.category =
      query.category === "General" ? { $in: ["General", null, ""] } : query.category;
  }

  if (typeof query.pinned === "boolean") {
    filter.pinned = query.pinned;
  }

  if (typeof query.starred === "boolean") {
    filter.starred = query.starred;
  }

  if (query.thisWeek === true) {
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    filter.createdAt = { $gte: weekStart };
  }

  return filter;
};

export const listNotes = async (req, res) => {
  const { page, limit } = req.query;
  const skip = (page - 1) * limit;
  const filter = buildNoteFilter(req.user, req.query);

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .sort({ pinned: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Note.countDocuments(filter)
  ]);
  const noteIds = notes.map((note) => note._id);
  const [commentCounts, attachmentCounts] = noteIds.length
    ? await Promise.all([
        Comment.aggregate([
          { $match: { noteId: { $in: noteIds } } },
          { $group: { _id: "$noteId", count: { $sum: 1 } } }
        ]),
        Attachment.aggregate([
          { $match: { noteId: { $in: noteIds } } },
          { $group: { _id: "$noteId", count: { $sum: 1 } } }
        ])
      ])
    : [[], []];
  const commentsByNoteId = new Map(
    commentCounts.map((item) => [item._id.toString(), item.count])
  );
  const attachmentsByNoteId = new Map(
    attachmentCounts.map((item) => [item._id.toString(), item.count])
  );
  const notesWithCounts = notes.map((note) => {
    const noteData = serializeNote(note);

    return {
      ...noteData,
      commentsCount: commentsByNoteId.get(noteData.id) || 0,
      attachmentsCount: attachmentsByNoteId.get(noteData.id) || 0
    };
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    data: notesWithCounts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};

export const createNote = async (req, res) => {
  const visibility = req.body.visibility || "private";

  if (visibility === "workspace" && !req.user.organizationId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Create or join a workspace to share notes.");
  }

  const note = await Note.create({
    ...req.body,
    visibility,
    organizationId: visibility === "workspace" ? req.user.organizationId : null,
    owner: req.user.id
  });

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: note
  });
};

export const getNote = async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.id,
    ...buildVisibilityFilter(req.user)
  });

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: note
  });
};

export const updateNote = async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.id,
    ...buildVisibilityFilter(req.user)
  });

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

  const isOwner = note.owner.toString() === req.user.id;

  if (!isOwner) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission for this note");
  }

  const nextVisibility = req.body.visibility || note.visibility || "private";

  if (nextVisibility === "workspace" && !req.user.organizationId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Create or join a workspace to share notes.");
  }

  Object.assign(note, req.body, {
    visibility: nextVisibility,
    organizationId: nextVisibility === "workspace" ? req.user.organizationId : null
  });
  await note.save();

  return res.status(StatusCodes.OK).json({
    success: true,
    data: note
  });
};

export const deleteNote = async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.id,
    ...buildVisibilityFilter(req.user)
  });

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

  const isOwner = note.owner.toString() === req.user.id;

  if ((note.visibility || "private") === "workspace" && !isOwner && !canManageWorkspaceNote(req.user)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only workspace owners or managers can delete another member's workspace note");
  }

  if ((note.visibility || "private") === "private" && !isOwner) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission for this note");
  }

  await note.deleteOne();

  return res.status(StatusCodes.NO_CONTENT).send();
};
