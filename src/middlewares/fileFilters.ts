import multer from "multer";
import path from "path";
import HttpException from "../exceptions/http.exception";

const mimeByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
};

const resolveMimeType = (
  file: Express.Multer.File,
  allowedFormats: Set<string>
) => {
  if (file.mimetype && allowedFormats.has(file.mimetype)) {
    return file.mimetype;
  }

  // Handle clients that default to application/octet-stream (e.g., some Flutter/dart HTTP libs).
  if (
    !file.mimetype ||
    file.mimetype === "application/octet-stream" ||
    file.mimetype === "binary/octet-stream"
  ) {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const inferredMime = mimeByExtension[extension];
    if (inferredMime && allowedFormats.has(inferredMime)) {
      return inferredMime;
    }
  }

  return null;
};

export const createFileFilter =
  (allowedFormats: string[]) =>
  (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedSet = new Set(allowedFormats);
    const mimeType = resolveMimeType(file, allowedSet);

    if (mimeType) {
      file.mimetype = mimeType;
      return cb(null, true);
    }

    const allowedDescription = Array.from(allowedSet).join(", ");
    cb(
      new HttpException(
        400,
        "invalid_file_type",
        `Unsupported file type: ${
          file.mimetype || "unknown"
        }. Allowed types: ${allowedDescription}`
      )
    );
  };
