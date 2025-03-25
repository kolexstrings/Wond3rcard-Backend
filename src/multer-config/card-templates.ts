import multer from "multer";
import path from "path";
import fs from "fs";
import HttpException from "../exceptions/http.exception";

// Ensure the directory exists
const ensureDirectoryExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Multer Storage Configuration for Card Templates
const cardTemplateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/card-templates";
    ensureDirectoryExists(uploadPath); // Ensure the directory exists
    cb(null, uploadPath); // Set the destination path
  },
  filename: (req, file, cb) => {
    const uniqueName = `template_${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName); // Set the filename
  },
});

// File Filter for SVG files
const cardTemplateFilter = (req: any, file: any, cb: any) => {
  if (path.extname(file.originalname).toLowerCase() !== ".svg") {
    return cb(
      new HttpException(400, "Invalid file", "Only SVG files are allowed!"),
      false
    );
  }
  cb(null, true);
};

// Multer configuration for card templates
const uploadCardTemplate = multer({
  storage: cardTemplateStorage,
  fileFilter: cardTemplateFilter,
});

export const uploadCardTemplateMiddleware = uploadCardTemplate.single("svg");
