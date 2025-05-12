import { createUploader } from "../uploadToCloudinary";

export const uploadCardMediaMiddleware = createUploader({
  folder: "card-media",
  allowedFormats: ["image/jpeg", "image/png", "video/mp4"],
  fileSizeLimitMB: 50,
}).fields([
  { name: "cardPhoto", maxCount: 1 },
  { name: "cardCoverPhoto", maxCount: 1 },
  { name: "cardVideo", maxCount: 1 },
]);
