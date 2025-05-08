import { createUploader } from "../uploadToCloudinary";

export const uploadCardTemplateMiddleware = createUploader({
  folder: "card-templates",
  allowedFormats: ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"],
  fileSizeLimitMB: 5,
}).single("svg");
