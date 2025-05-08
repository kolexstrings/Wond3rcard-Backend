import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";
import HttpException from "../exceptions/http.exception";

// Upload final physical card design to Cloudinary
export const uploadPhysicalCardMiddleware = async (
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
    const validMimeTypes = ["image/jpeg", "image/png", "image/svg+xml"];
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new HttpException(
        400,
        "Invalid file type",
        "Only JPG, PNG, and SVG images are allowed!"
      );
    }

    // Upload to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "physical-cards",
        public_id: `physical_card_${Date.now()}`,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          next(new HttpException(500, "Upload failed", error.message));
        } else {
          res.status(200).json({ success: true, url: result?.secure_url });
        }
      }
    );

    stream.end(file.buffer);
  } catch (error: any) {
    next(error);
  }
};
