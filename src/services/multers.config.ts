// src/multerMiddleware.ts
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import HttpException from '../exceptions/http.exception';


// Configure multer to store files in memory as Buffers
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadSingleFile = () => {
  try { upload.single('file') } catch (e) { }
} // Middleware for single file upload

// Middleware for uploading multiple files in a single field
export const uploadManyFiles = upload.array('files', 10); // Allow up to 10 files in a single upload

// Middleware for uploading multiple types of files in separate fields
export const uploadMediaFiles = upload.fields([
  { name: 'audio', maxCount: 5 },  // Up to 5 audio files
  { name: 'video', maxCount: 5 },  // Up to 5 video files
  { name: 'documents', maxCount: 10 }, // Up to 10 document files
]);

// const uploadFont = multer({ fontStroage, fontFilter });

// export const uploadFontMiddleware = uploadFont.single('font'); // Middleware for single file upload



// Ensure upload directories exist
const ensureDirectoryExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Helper function to delete existing files
export const deleteFileIfExists = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath); // Delete the file
  }
};

/**
 * Find an uploaded image in the directory and rename it
 * @param oldName - The current name of the file
 * @param newName - The desired new name of the file
 * @param directory - The directory where the file is stored
 */
export const renameUploadedFile = (oldName: string, newName: string, directory: string) => {
  try {
    const oldPath = path.join(directory, oldName);
    const newPath = path.join(directory, newName);

    if (!fs.existsSync(oldPath)) {
      throw new Error(`File not found: ${oldPath}`);
    }

    // Rename the file
    fs.renameSync(oldPath, newPath);

    console.log(`File renamed successfully from ${oldName} to ${newName}`);
    return newPath;
  } catch (error) {
    console.error('Error renaming file:', error.message);
    throw error;
  }
};

// Configure storage for social media uploads
const socialMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/social-media';
    ensureDirectoryExists(uploadPath); // Ensure directory exists
    cb(null, uploadPath); // Set the destination
  },
  filename: (req, file, cb) => {
    try {
      const uploadPath = 'uploads/social-media';
      const cleanName = req.body.name.replace(/\s+/g, '_').toLowerCase(); // Clean up the name
      const fileExt = path.extname(file.originalname); // Get file extension
      const uniqueName = `${cleanName}${fileExt}`; // Combine name with extension
      const filePath = path.join(uploadPath, uniqueName);

      // Check if the file exists and delete it
      deleteFileIfExists(filePath);

      cb(null, uniqueName); // Use the clean name as the file name
    } catch (error) {
      cb(new HttpException(400, 'Invalid file', 'Failed to generate file name'), null);
    }
  },
});

// File filter for social media images
const socialMediaFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new HttpException(400, 'Invalid file', 'Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure Multer with storage and file filter
const uploadSocialMedia = multer({
  storage: socialMediaStorage,
  fileFilter: socialMediaFilter,
});

// Middleware for uploading a single social media image
export const uploadSocialMediaMiddleware = uploadSocialMedia.single('imageUrl');


// Configure storage for social media uploads
const fontsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/fonts';
    ensureDirectoryExists(uploadPath); // Ensure directory exists
    cb(null, uploadPath); // Set the destination
  },
  filename: (req, file, cb) => {
    try {
      const uploadPath = 'uploads/fonts';
      const cleanName = req.body.name.replace(/\s+/g, '_').toLowerCase(); // Clean up the name
      const fileExt = path.extname(file.originalname); // Get file extension
      const uniqueName = `${cleanName}${fileExt}`; // Combine name with extension
      const filePath = path.join(uploadPath, uniqueName);

      // Check if the file exists and delete it
      deleteFileIfExists(filePath);

      cb(null, uniqueName); // Use the clean name as the file name
    } catch (error) {
      cb(new HttpException(400, 'Invalid file', 'Failed to generate font name'), null);
    }
  },
});

// File filter for social media images
const fontsFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
  if (allowedExtensions.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    return cb(new HttpException(400, 'Invalid font', 'Only font files are allowed'), false);
  }
};

// Configure Multer with storage and file filter
const uploadFont = multer({
  storage: fontsStorage,
  fileFilter: fontsFilter,
});

export const uploadFontMiddleware = uploadFont.single('font');


// File filter to allow only image files
const fileFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new HttpException(400, 'Invalid file', 'Only image files are allowed!'), false);
  }
  cb(null, true);
};


export const uploadProfileAndCoverMiddleware = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath =
        file.fieldname === 'profilePhoto' ? 'uploads/profile' : 'uploads/cover';
      ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter,
}).fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 },
]);

// Helper function to check file size
const fileSizeLimit = (file: any, maxSize: number, cb: any) => {
  if (file.size > maxSize) {
    return cb(
      new HttpException(400, 'Invalid file size', `File size should not exceed ${maxSize / (1024 * 1024)}MB`),
      false
    );
  }
  cb(null, true);
};


// Storage configuration for card uploads
const cardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath =
      file.fieldname === 'cardPhoto'
        ? 'uploads/cards/photos'
        : file.fieldname === 'cardCoverPhoto'
          ? 'uploads/cards/covers'
          : 'uploads/cards/videos';

    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter for images and videos
const cardFileFilter = (req: any, file: any, cb: any) => {
  if (file.fieldname === 'cardVideo') {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new HttpException(400, 'Invalid file type', 'Only video files are allowed for cardVideo!'), false);
    }
    fileSizeLimit(file, 10 * 1024 * 1024, cb); // 10MB limit for videos
  } else {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new HttpException(400, 'Invalid file type', 'Only image files are allowed for cardPhoto and cardCoverPhoto!'), false);
    }
    cb(null, true);
  }
};


// Configure Multer for card uploads
export const uploadCardMediaMiddleware = multer({
  storage: cardStorage,
  fileFilter: cardFileFilter,
}).fields([
  { name: 'cardPhoto', maxCount: 1 },
  { name: 'cardCoverPhoto', maxCount: 1 },
  { name: 'cardVideo', maxCount: 1 },
]);

// Configure storage for social media uploads
const catelogueStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/cards/catelogue';
    try {
      ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    } catch (error) {
      cb(new HttpException(500, 'Storage Error', 'Failed to create upload directory.'), null);
    }
  },
  filename: (req, file, cb) => {
    try {
      const uploadPath = 'uploads/cards/catelogue';
      const cleanName = `cateloguePhoto_${Date.now()}`;
      const fileExt = path.extname(file.originalname); // Get file extension
      const uniqueName = `${cleanName}${fileExt}`; // Combine name with extension
      const filePath = path.join(uploadPath, uniqueName);

      // Check if the file exists and delete it
      deleteFileIfExists(filePath);

      cb(null, uniqueName); // Use the clean name as the file name
    } catch (error) {
      cb(new HttpException(400, 'Invalid file', 'Failed to generate file name'), null);
    }

  },
});

// File filter for social media images
const catelogueFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new HttpException(400, 'Invalid file', 'Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure Multer with storage and file filter
const uploadCatelogueImage = multer({
  storage: catelogueStorage,
  fileFilter: catelogueFilter,
});

// Middleware for uploading a single social media image
export const uploadCatelogueMiddleware = uploadCatelogueImage.single('cateloguePhoto');
