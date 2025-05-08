import multer from "multer";

export const createFileFilter =
  (allowedFormats: string[]) =>
  (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  };
