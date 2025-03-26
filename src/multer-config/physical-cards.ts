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

// Multer Storage Configuration for Physical Cards (final design)
const physicalCardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/physical-cards"; // Folder to store physical card designs
    ensureDirectoryExists(uploadPath); // Ensure the directory exists
    cb(null, uploadPath); // Set the destination path
  },
  filename: (req, file, cb) => {
    const uniqueName = `physical_card_${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName); // Set the filename
  },
});

// File Filter for Image files (for design)
const physicalCardFilter = (req: any, file: any, cb: any) => {
  const validTypes = [".jpg", ".jpeg", ".png", ".svg"];
  if (!validTypes.includes(path.extname(file.originalname).toLowerCase())) {
    return cb(
      new HttpException(400, "Invalid file", "Only image files are allowed!"),
      false
    );
  }
  cb(null, true);
};

// Multer configuration for the physical card final design
const uploadPhysicalCard = multer({
  storage: physicalCardStorage,
  fileFilter: physicalCardFilter,
});

export const uploadPhysicalCardMiddleware =
  uploadPhysicalCard.single("finalDesign");
