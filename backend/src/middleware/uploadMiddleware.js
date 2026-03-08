const fs = require('fs');
const path = require('path');
const multer = require('multer');

const createUploadDirectory = (...segments) => {
  const directory = path.join(process.cwd(), 'uploads', ...segments);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
};

const sanitizeFilename = (filename) => {
  const extension = path.extname(filename || '').toLowerCase();
  const basename = path
    .basename(filename || 'file', extension)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return `${basename || 'file'}${extension}`;
};

const createStorage = (directory) => multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, directory),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${sanitizeFilename(file.originalname)}`);
  },
});

const createFileFilter = (acceptedTypes, errorMessage) => (_req, file, cb) => {
  if (!acceptedTypes.includes(file.mimetype)) {
    return cb(new Error(errorMessage));
  }
  return cb(null, true);
};

const moveInUpload = multer({
  storage: createStorage(createUploadDirectory('move-ins')),
  fileFilter: createFileFilter(
    ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    'Only PDF and image files (jpeg, png, webp) are allowed'
  ),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const listingUpload = multer({
  storage: createStorage(createUploadDirectory('listings')),
  fileFilter: createFileFilter(
    ['image/jpeg', 'image/png', 'image/webp'],
    'Only image files (jpeg, png, webp) are allowed for listings'
  ),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
    parts: 40,
  },
});

module.exports = { moveInUpload, listingUpload };
