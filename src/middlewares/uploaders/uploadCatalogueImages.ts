import { createUploader } from "../uploadToCloudinary";

export const uploadCatelogueMiddleware = createUploader({
  folder: "card-catelogue",
  allowedFormats: ["image/jpeg", "image/png", "image/webp"],
  fileSizeLimitMB: 5,
}).array("cateloguePhoto", 20); // assuming max 20 images at once
