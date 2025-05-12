import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { createFileFilter } from "./fileFilters";

// Cloudinary config — ideally move these to env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

// Central upload middleware generator
export const createUploader = (options: {
  folder: string;
  allowedFormats: string[];
  fileSizeLimitMB: number;
}) => {
  // Cloudinary storage config — no need for allowed_formats here
  const storage = new CloudinaryStorage({
    cloudinary,
    params: () => ({
      folder: options.folder,
      resource_type: "auto",
    }),
  });

  // Multer instance with limits and storage
  return multer({
    storage,
    fileFilter: createFileFilter(options.allowedFormats),
    limits: {
      fileSize: options.fileSizeLimitMB * 1024 * 1024, // bytes
    },
  });
};
