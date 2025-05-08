import multer from "multer";
import cloudinary from "../config/cloudinary";
import { Request, Response, NextFunction } from "express";
import HttpException from "../exceptions/http.exception";

// Multer config to keep file in memory
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Controller function
export const uploadCardTemplateMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file;
    if (!file) {
      throw new HttpException(400, "No file provided", "Please upload a file.");
    }

    // Validate file type
    if (file.mimetype !== "image/svg+xml") {
      throw new HttpException(
        400,
        "Invalid file type",
        "Only SVG files are allowed!"
      );
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: "card-templates",
          public_id: `template_${Date.now()}`,
          overwrite: true,
          format: "svg",
        },
        (error, result) => {
          if (error) {
            next(new HttpException(500, "Upload failed", error.message));
          } else {
            res.status(200).json({ success: true, url: result?.secure_url });
          }
        }
      )
      .end(file.buffer);
  } catch (error: any) {
    next(error);
  }
};
