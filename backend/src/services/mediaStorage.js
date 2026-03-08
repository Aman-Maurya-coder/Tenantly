const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');

const MEDIA_BUCKET_NAME = 'media';
const MAX_UPLOAD_ATTEMPTS = 2;

const getMediaBucket = () => {
  if (!mongoose.connection?.db) {
    throw new Error('MongoDB connection is not ready');
  }

  return new GridFSBucket(mongoose.connection.db, { bucketName: MEDIA_BUCKET_NAME });
};

const getMediaPath = (mediaId) => `/api/media/${mediaId}`;

const resolveStoredPath = (storedPath) => {
  if (!storedPath) {
    return null;
  }

  if (path.isAbsolute(storedPath)) {
    return storedPath;
  }

  return path.join(process.cwd(), storedPath.replace(/^\/+/, ''));
};

const unlinkLocalFile = async (storedPath) => {
  const absolutePath = resolveStoredPath(storedPath);
  if (!absolutePath) {
    return;
  }

  try {
    await fsPromises.unlink(absolutePath);
  } catch (_error) {
    // Best-effort cleanup for temporary uploads and legacy files.
  }
};

const uploadFileAttempt = (file, metadata, attempt) => new Promise((resolve, reject) => {
  const bucket = getMediaBucket();
  const filename = `${Date.now()}-${attempt}-${file.filename}`;
  const uploadStream = bucket.openUploadStream(filename, {
    contentType: file.mimetype,
    metadata,
  });
  const readStream = fs.createReadStream(file.path);

  const abortWithError = (error) => {
    readStream.destroy();
    uploadStream.destroy(error);
    reject(error);
  };

  readStream.on('error', reject);
  uploadStream.on('error', reject);
  uploadStream.on('finish', () => {
    resolve({
      mediaId: String(uploadStream.id),
      storedName: filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: getMediaPath(String(uploadStream.id)),
    });
  });

  readStream.on('open', () => {
    readStream.pipe(uploadStream);
  });

  readStream.on('close', () => {
    if (readStream.destroyed && !uploadStream.destroyed && !uploadStream.writableEnded) {
      abortWithError(new Error('Failed to read temporary upload from disk'));
    }
  });
});

const persistUploadedFileToMedia = async (file, metadata = {}) => {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt += 1) {
    try {
      const storedFile = await uploadFileAttempt(file, metadata, attempt);
      await unlinkLocalFile(file.path);
      return storedFile;
    } catch (error) {
      lastError = error;
    }
  }

  await unlinkLocalFile(file.path);
  throw lastError;
};

const persistUploadedFilesToMedia = async (files, metadataBuilder) => {
  const storedFiles = [];

  try {
    for (const [index, file] of (files || []).entries()) {
      const metadata = typeof metadataBuilder === 'function' ? metadataBuilder(file, index) : {};
      const storedFile = await persistUploadedFileToMedia(file, metadata);
      storedFiles.push(storedFile);
    }

    return storedFiles;
  } catch (error) {
    await Promise.all(storedFiles.map((asset) => deleteStoredAsset(asset)));
    throw error;
  }
};

const deleteMediaById = async (mediaId) => {
  if (!mediaId) {
    return;
  }

  try {
    const bucket = getMediaBucket();
    await bucket.delete(new ObjectId(mediaId));
  } catch (_error) {
    // Ignore missing files during cleanup.
  }
};

const deleteStoredAsset = async (asset) => {
  if (!asset) {
    return;
  }

  if (asset.mediaId) {
    await deleteMediaById(asset.mediaId);
    return;
  }

  if (asset.path && !String(asset.path).startsWith('/api/media/')) {
    await unlinkLocalFile(asset.path);
  }
};

const deleteStoredAssets = async (assets) => {
  await Promise.all((assets || []).map((asset) => deleteStoredAsset(asset)));
};

const findMediaFile = async (mediaId) => {
  if (!ObjectId.isValid(mediaId)) {
    return null;
  }

  const bucket = getMediaBucket();
  const files = await bucket.find({ _id: new ObjectId(mediaId) }).toArray();
  return files[0] || null;
};

const openMediaDownloadStream = (mediaId) => {
  const bucket = getMediaBucket();
  return bucket.openDownloadStream(new ObjectId(mediaId));
};

module.exports = {
  findMediaFile,
  openMediaDownloadStream,
  persistUploadedFileToMedia,
  persistUploadedFilesToMedia,
  deleteStoredAsset,
  deleteStoredAssets,
  getMediaPath,
};