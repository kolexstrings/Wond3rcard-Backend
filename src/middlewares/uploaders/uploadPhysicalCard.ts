import { createUploader } from "../uploadToCloudinary";

export const uploadPhysicalCardMiddleware = createUploader({
  folder: "physical-cards",
  allowedFormats: ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"],
  fileSizeLimitMB: 5,
}).single("finalDesign");
