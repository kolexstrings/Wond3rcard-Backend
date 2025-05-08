import { createUploader } from "../uploadToCloudinary";

export const uploadProfileAndCoverMiddleware = createUploader({
  folder: "user-media",
  allowedFormats: ["image/jpeg", "image/png", "image/webp"],
  fileSizeLimitMB: 5,
}).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "coverPhoto", maxCount: 1 },
]);
