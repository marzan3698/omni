import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
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
const socialUploadsDir = path.join(process.cwd(), 'uploads', 'social');
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
const themeUploadsDir = path.join(process.cwd(), 'uploads', 'theme');
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

