import { createUploader } from "../uploadToCloudinary";

export const uploadFontMiddleware = createUploader({
  folder: "fonts",
  allowedFormats: ["font/woff", "font/woff2", "font/ttf"],
  fileSizeLimitMB: 5,
}).single("font");
