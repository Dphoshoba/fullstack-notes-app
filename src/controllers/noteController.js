import { StatusCodes } from "http-status-codes";

import { Note } from "../models/Note.js";
import { ApiError } from "../utils/ApiError.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildNoteFilter = (userId, query) => {
  const filter = { owner: userId };

  if (query.search) {
    const searchRegex = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ title: searchRegex }, { body: searchRegex }, { tags: searchRegex }];
  }

  if (query.category) {
    filter.category =
      query.category === "General" ? { $in: ["General", null, ""] } : query.category;
  }

  if (typeof query.pinned === "boolean") {
    filter.pinned = query.pinned;
  }

  return filter;
};

export const listNotes = async (req, res) => {
  const { page, limit } = req.query;
  const skip = (page - 1) * limit;
  const filter = buildNoteFilter(req.user.id, req.query);

  const [notes, total] = await Promise.all([
    Note.find(filter).sort({ pinned: -1, updatedAt: -1 }).skip(skip).limit(limit),
    Note.countDocuments(filter)
  ]);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: notes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};

export const createNote = async (req, res) => {
  const note = await Note.create({
    ...req.body,
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
    owner: req.user.id
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
  const note = await Note.findOneAndUpdate(
    {
      _id: req.params.id,
      owner: req.user.id
    },
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: note
  });
};

export const deleteNote = async (req, res) => {
  const note = await Note.findOneAndDelete({
    _id: req.params.id,
    owner: req.user.id
  });

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

  return res.status(StatusCodes.NO_CONTENT).send();
};
