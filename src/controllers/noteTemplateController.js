import { StatusCodes } from "http-status-codes";

import { NoteTemplate } from "../models/NoteTemplate.js";

export const listTemplates = async (req, res) => {
  const templates = await NoteTemplate.find({ owner: req.user.id }).sort({ updatedAt: -1 });
  return res.status(StatusCodes.OK).json({ success: true, data: templates });
};

export const createTemplate = async (req, res) => {
  const template = await NoteTemplate.create({
    owner: req.user.id,
    name: req.body.name,
    noteType: req.body.noteType || "standard",
    category: req.body.category || "General",
    title: req.body.title || "",
    body: req.body.body || ""
  });
  return res.status(StatusCodes.CREATED).json({ success: true, data: template });
};

export const deleteTemplate = async (req, res) => {
  const result = await NoteTemplate.deleteOne({ _id: req.params.id, owner: req.user.id });
  if (!result.deletedCount) {
    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Template not found" });
  }
  return res.status(StatusCodes.OK).json({ success: true, message: "Template deleted" });
};
