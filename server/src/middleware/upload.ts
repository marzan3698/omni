import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Use process.cwd() which always reliably points to the root of the executed application
// (In this case, the `server/` directory or `~/api/` on cPanel Passenger)
const rootUploadsDir = path.join(process.cwd(), 'uploads');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(rootUploadsDir, 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter - only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Configure multer
export const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Single file upload middleware
export const singleProductImage = uploadProductImage.single('image');

// ============================================
// Social Messages Image Upload
// ============================================

// Create uploads directory for social messages if it doesn't exist
const socialUploadsDir = path.join(rootUploadsDir, 'social');
if (!fs.existsSync(socialUploadsDir)) {
  fs.mkdirSync(socialUploadsDir, { recursive: true });
}

// Configure storage for social messages
const socialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, socialUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    // Sanitize filename - remove special characters
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter for social messages - only images
const socialFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('🔍 File filter check:', {
    filename: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname,
  });

  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    console.log('✅ File type allowed:', file.mimetype);
    cb(null, true);
  } else {
    console.error('❌ File type rejected:', file.mimetype);
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, GIF, and WebP images are allowed.`));
  }
};

// Configure multer for social messages
export const uploadSocialImage = multer({
  storage: socialStorage,
  fileFilter: socialFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Single file upload middleware for social messages
export const singleSocialImage = uploadSocialImage.single('image');

// ============================================
// Theme Logo Upload
// ============================================

// Create uploads directory for theme logo if it doesn't exist
const themeUploadsDir = path.join(rootUploadsDir, 'theme');
if (!fs.existsSync(themeUploadsDir)) {
  fs.mkdirSync(themeUploadsDir, { recursive: true });
}

// Configure storage for theme logo
const themeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, themeUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: logo-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  },
});

// File filter for theme logo - only images (including SVG)
const themeFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed.'));
  }
};

// Configure multer for theme logo
export const uploadThemeLogo = multer({
  storage: themeStorage,
  fileFilter: themeFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});

// Single file upload middleware for theme logo
export const singleThemeLogo = uploadThemeLogo.single('logo');

// ============================================
// Service Category Icon Upload
// ============================================

const serviceCategoryIconDir = path.join(rootUploadsDir, 'service-categories');
if (!fs.existsSync(serviceCategoryIconDir)) {
  fs.mkdirSync(serviceCategoryIconDir, { recursive: true });
}

const serviceCategoryIconStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, serviceCategoryIconDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `icon-${uniqueSuffix}${ext}`);
  },
});

const serviceCategoryIconFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed.'));
};

export const uploadServiceCategoryIcon = multer({
  storage: serviceCategoryIconStorage,
  fileFilter: serviceCategoryIconFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const singleServiceCategoryIcon = uploadServiceCategoryIcon.single('icon');

// ============================================
// Task Attachments Upload (Images, PDFs, Videos, Audio)
// ============================================

// Create uploads directory for task attachments if it doesn't exist
const taskUploadsBaseDir = path.join(rootUploadsDir, 'tasks');
if (!fs.existsSync(taskUploadsBaseDir)) {
  fs.mkdirSync(taskUploadsBaseDir, { recursive: true });
}

// Configure storage for task attachments
// Note: Destination will be set dynamically based on taskId or subTaskId in the request
const taskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get taskId or subTaskId from request body/params
    // Note: route uses :id, so check req.params.id first, then req.params.taskId
    const taskId = (req.params?.id || req.body?.taskId || req.params?.taskId || req.query?.taskId) as string | undefined;
    const subTaskId = (req.body?.subTaskId || req.params?.subTaskId || req.query?.subTaskId) as string | undefined;

    let uploadDir: string;

    if (taskId) {
      uploadDir = path.join(taskUploadsBaseDir, `task-${taskId}`, 'attachments');
    } else if (subTaskId) {
      uploadDir = path.join(taskUploadsBaseDir, `subtask-${subTaskId}`, 'attachments');
    } else {
      // Fallback to a temporary directory if no task/subtask ID provided
      uploadDir = path.join(taskUploadsBaseDir, 'temp');
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-sanitized-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    // Sanitize filename - remove special characters but keep spaces and hyphens
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9\s-_]/g, '_');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter for task attachments - supports images, PDFs, videos, and audio
const taskFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define allowed MIME types for task attachments
  const allowedMimes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // PDFs
    'application/pdf',
    // Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    'audio/flac',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Allowed types: Images (JPEG, PNG, GIF, WebP), PDFs, Videos (MP4, WebM, AVI, MOV), Audio (MP3, WAV, OGG, WebM, AAC, FLAC).`
      )
    );
  }
};

// Configure multer for task attachments
export const uploadTaskAttachment = multer({
  storage: taskStorage,
  fileFilter: taskFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (for videos)
  },
});

// Single file upload middleware for task attachments
export const singleTaskAttachment = uploadTaskAttachment.single('file');

// Multiple files upload middleware for task attachments
export const multipleTaskAttachments = uploadTaskAttachment.array('files', 10); // Max 10 files at once

// ============================================
// Hero Background Image Upload
// ============================================

// Create uploads directory for hero images if it doesn't exist
const heroImageUploadsDir = path.join(rootUploadsDir, 'theme', 'hero');
if (!fs.existsSync(heroImageUploadsDir)) {
  fs.mkdirSync(heroImageUploadsDir, { recursive: true });
}

// Configure storage for hero images
const heroImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, heroImageUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: hero-image-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `hero-image-${uniqueSuffix}${ext}`);
  },
});

// File filter for hero images - only images
const heroImageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Configure multer for hero images
export const uploadHeroImage = multer({
  storage: heroImageStorage,
  fileFilter: heroImageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Single file upload middleware for hero images
export const singleHeroImage = uploadHeroImage.single('image');

// ============================================
// Hero Background Video Upload
// ============================================

// Configure storage for hero videos (same directory as images)
const heroVideoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, heroImageUploadsDir); // Use same directory
  },
  filename: (req, file, cb) => {
    // Generate unique filename: hero-video-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `hero-video-${uniqueSuffix}${ext}`);
  },
});

// File filter for hero videos - only videos
const heroVideoFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['video/mp4', 'video/webm'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4 and WebM videos are allowed.'));
  }
};

// Configure multer for hero videos
export const uploadHeroVideo = multer({
  storage: heroVideoStorage,
  fileFilter: heroVideoFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Single file upload middleware for hero videos
export const singleHeroVideo = uploadHeroVideo.single('video');

// ============================================
// Hero Addon Image Upload (supports GIF)
// ============================================

// Configure storage for hero addon images (same directory as hero images)
const heroAddonImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, heroImageUploadsDir); // Use same directory
  },
  filename: (req, file, cb) => {
    // Generate unique filename: hero-addon-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `hero-addon-${uniqueSuffix}${ext}`);
  },
});

// File filter for hero addon images - images including GIF
const heroAddonImageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'));
  }
};

// Configure multer for hero addon images
export const uploadHeroAddonImage = multer({
  storage: heroAddonImageStorage,
  fileFilter: heroAddonImageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (larger for GIFs)
  },
});

// Single file upload middleware for hero addon images
export const singleHeroAddonImage = uploadHeroAddonImage.single('addonImage');

// ============================================
// Activity Screenshot Upload (JPEG, 2MB)
// ============================================

const screenshotsDir = path.join(rootUploadsDir, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const screenshotStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, screenshotsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `screenshot-${uniqueSuffix}.jpg`);
  },
});

const screenshotFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['image/jpeg', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG images are allowed.'));
  }
};

export const uploadScreenshot = multer({
  storage: screenshotStorage,
  fileFilter: screenshotFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const singleScreenshot = uploadScreenshot.single('screenshot');
