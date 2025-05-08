import { createUploader } from "../uploadToCloudinary";

export const uploadCatalogueImagesMiddleware = createUploader({
  folder: "card-catelogue",
  allowedFormats: ["image/jpeg", "image/png", "image/webp"],
  fileSizeLimitMB: 5,
}).array("images", 20); // assuming max 20 images at once
