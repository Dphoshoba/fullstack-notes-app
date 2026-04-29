import fs from "node:fs";
import path from "node:path";

import multer from "multer";
import { nanoid } from "nanoid";

import { ApiError } from "../utils/ApiError.js";

export const uploadsDir = path.resolve("uploads");
const maxFileSize = 10 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown"
]);

const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx", ".txt", ".md"]);
const allowedFileTypesMessage = "Unsupported file type. Allowed files: PDF, JPG, JPEG, PNG, WEBP, DOC, DOCX, TXT, and MD.";

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${nanoid(12)}${extension}`);
  }
});

const fileFilter = (_req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
    return callback(new ApiError(400, allowedFileTypesMessage));
  }

  return callback(null, true);
};

export const uploadAttachment = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize
  }
});
