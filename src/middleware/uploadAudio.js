import multer from "multer";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/ApiError.js";

const AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
  "audio/aac",
  "audio/opus"
]);

const AUDIO_EXTENSIONS = new Set([
  "webm", "wav", "mp3", "m4a", "ogg", "flac", "aac", "opus", "mp4", "webm"
]);

const storage = multer.memoryStorage();

export const uploadAudio = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const mimeType = (file.mimetype || "").toLowerCase();
    const ext = (file.originalname || "").split(".").pop()?.toLowerCase() || "";

    if (AUDIO_MIME_TYPES.has(mimeType) || AUDIO_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new ApiError(StatusCodes.BAD_REQUEST, "Unsupported audio format. Use webm, wav, mp3, m4a, ogg, or flac."));
    }
  }
});
