import { createUploader } from "../uploadToCloudinary";

export const uploadSocialMediaMiddleware = createUploader({
  folder: "social-media",
  allowedFormats: ["image/jpeg", "image/png", "image/webp"],
  fileSizeLimitMB: 5,
}).single("imageUrl");
