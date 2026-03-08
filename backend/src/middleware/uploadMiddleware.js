const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDirectory = path.join(process.cwd(), 'uploads', 'move-ins');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirectory),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeOriginal}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!acceptedTypes.includes(file.mimetype)) {
    return cb(new Error('Only PDF and image files (jpeg, png, webp) are allowed'));
  }
  return cb(null, true);
};

const moveInUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { moveInUpload };
