import { StatusCodes } from "http-status-codes";

import { Attachment } from "../models/Attachment.js";
import { Comment } from "../models/Comment.js";
import { Note } from "../models/Note.js";
import { NoteHistory } from "../models/NoteHistory.js";
import { User } from "../models/User.js";
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

const normalizeMeetingMeta = (meetingMeta = {}) => ({
  ...meetingMeta,
  meetingDate: meetingMeta.meetingDate || null,
  followUpDate: meetingMeta.followUpDate || null,
  attendees: Array.isArray(meetingMeta.attendees)
    ? meetingMeta.attendees.map((attendee) => attendee.trim()).filter(Boolean)
    : [],
  blockers: Array.isArray(meetingMeta.blockers)
    ? meetingMeta.blockers.map((item) => String(item || "").trim()).filter(Boolean)
    : [],
  risks: Array.isArray(meetingMeta.risks)
    ? meetingMeta.risks.map((item) => String(item || "").trim()).filter(Boolean)
    : [],
  deadlines: Array.isArray(meetingMeta.deadlines)
    ? meetingMeta.deadlines.map((item) => String(item || "").trim()).filter(Boolean)
    : [],
  followUps: Array.isArray(meetingMeta.followUps)
    ? meetingMeta.followUps.map((item) => String(item || "").trim()).filter(Boolean)
    : [],
  executiveSummary: String(meetingMeta.executiveSummary || "").trim(),
  meetingType: String(meetingMeta.meetingType || "").trim(),
  priorityLevel: String(meetingMeta.priorityLevel || "").trim()
});

const normalizeActionFields = (input) => {
  const normalized = { ...input };

  if (Object.hasOwn(normalized, "dueDate")) {
    normalized.dueDate = normalized.dueDate || null;
  }

  if (Object.hasOwn(normalized, "dueTime")) {
    normalized.dueTime = String(normalized.dueTime || "").trim();
  }

  if (Object.hasOwn(normalized, "reminderAt")) {
    normalized.reminderAt = normalized.reminderAt || null;
  }

  if (Object.hasOwn(normalized, "actionStatus")) {
    normalized.actionStatus = normalized.actionStatus || "open";
  }

  if (Object.hasOwn(normalized, "priority")) {
    normalized.priority = normalized.priority || "";
  }

  return normalized;
};

/**
 * @param {any} input
 * @param {{ defaultNoteType?: string }} [options]
 */
const normalizeNoteInput = (input, { defaultNoteType } = {}) => {
  const normalizedInput = normalizeActionFields(input);
  const noteType = input.noteType || defaultNoteType;

  if (!noteType && !input.meetingMeta) {
    return normalizedInput;
  }

  if (noteType !== "meeting") {
    return {
      ...normalizedInput,
      noteType: "standard",
      meetingMeta: undefined
    };
  }

  return {
    ...normalizedInput,
    noteType,
    meetingMeta: normalizeMeetingMeta(input.meetingMeta)
  };
};

const historySnapshot = (note) => ({
  title: note.title,
  body: note.body,
  tags: [...(note.tags || [])],
  category: note.category,
  noteType: note.noteType || "standard",
  meetingMeta: note.meetingMeta ? note.meetingMeta.toObject?.() || note.meetingMeta : undefined,
  visibility: note.visibility || "private",
  organizationId: note.organizationId || null,
  pinned: Boolean(note.pinned),
  starred: Boolean(note.starred),
  dueDate: note.dueDate || null,
  dueTime: note.dueTime || "",
  reminderAt: note.reminderAt || null,
  actionStatus: note.actionStatus || "open",
  priority: note.priority || "",
  updatedAt: note.updatedAt
});

const saveNoteHistory = async (note, userId, changeType = "update") =>
  NoteHistory.create({
    noteId: note._id,
    editedBy: userId,
    changeType,
    snapshot: historySnapshot(note)
  });

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

  if (query.noteType && query.noteType !== "all") {
    filter.noteType = query.noteType;
  }

  if (query.thisWeek === true) {
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    filter.createdAt = { $gte: weekStart };
  }

  if (typeof query.hasDueDate === "boolean") {
    if (query.hasDueDate) {
      filter.dueDate = { $ne: null };
    } else {
      filter.$and = [
        ...(filter.$and || []),
        { $or: [{ dueDate: null }, { dueDate: { $exists: false } }] }
      ];
    }
  }

  if (query.actionStatus) {
    filter.actionStatus = query.actionStatus;
  }

  if (query.dueFrom || query.dueTo) {
    const dueDateRange = typeof filter.dueDate === "object" && !Array.isArray(filter.dueDate)
      ? { ...filter.dueDate }
      : {};

    if (query.dueFrom) {
      const dueFrom = new Date(query.dueFrom);
      dueFrom.setHours(0, 0, 0, 0);
      dueDateRange.$gte = dueFrom;
    }

    if (query.dueTo) {
      const dueTo = new Date(query.dueTo);
      dueTo.setHours(23, 59, 59, 999);
      dueDateRange.$lte = dueTo;
    }

    filter.dueDate = dueDateRange;
  }

  if (query.overdue === true) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filter.dueDate = { ...(typeof filter.dueDate === "object" && !Array.isArray(filter.dueDate) ? filter.dueDate : {}), $lt: today };
    filter.actionStatus = { $ne: "done" };
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
    ...normalizeNoteInput(req.body, { defaultNoteType: "standard" }),
    visibility,
    organizationId: visibility === "workspace" ? req.user.organizationId : null,
    owner: req.user.id
  });

  if (!req.user.onboardingCompleted) {
    req.user.onboardingCompleted = true;
    await User.findByIdAndUpdate(req.user.id, { onboardingCompleted: true });
  }

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: note
  });
};

export const getNote = async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.id,
    ...buildVisibilityFilter(req.user)
  }).lean();

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

  const [commentsCount, attachmentsCount] = await Promise.all([
    Comment.countDocuments({ noteId: note._id }),
    Attachment.countDocuments({ noteId: note._id })
  ]);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      ...serializeNote(note),
      commentsCount,
      attachmentsCount
    }
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

  await saveNoteHistory(note, req.user.id, "update");

  Object.assign(note, normalizeNoteInput(req.body), {
    visibility: nextVisibility,
    organizationId: nextVisibility === "workspace" ? req.user.organizationId : null
  });
  await note.save();

  return res.status(StatusCodes.OK).json({
    success: true,
    data: note
  });
};

export const listNoteHistory = async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.id,
    ...buildVisibilityFilter(req.user)
  });

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

  const history = await NoteHistory.find({ noteId: note._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("editedBy", "name email")
    .lean();

  return res.status(StatusCodes.OK).json({
    success: true,
    data: history.map((item) => {
      const { _id, ...historyItem } = item;
      delete historyItem.__v;

      return {
        ...historyItem,
        id: _id.toString()
      };
    })
  });
};

export const restoreNoteHistory = async (req, res) => {
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

  const history = await NoteHistory.findOne({
    _id: req.params.historyId,
    noteId: note._id
  });

  if (!history) {
    throw new ApiError(StatusCodes.NOT_FOUND, "History version not found");
  }

  await saveNoteHistory(note, req.user.id, "restore");

  const snapshot = { ...(history.toObject().snapshot || {}) };
  delete snapshot.updatedAt;

  Object.assign(note, {
    ...snapshot,
    organizationId:
      (snapshot.visibility || "private") === "workspace"
        ? snapshot.organizationId || req.user.organizationId
        : null
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

  await Promise.all([note.deleteOne(), NoteHistory.deleteMany({ noteId: note._id })]);

  return res.status(StatusCodes.NO_CONTENT).send();
};
