const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const dotenv = require('dotenv');

const connectDB = require('../config/db');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { getMediaPath } = require('../services/mediaStorage');

dotenv.config();

const MEDIA_BUCKET_NAME = 'media';
const DEMO_TAG = '[DEMO-SEED-2026]';

const MIME_BY_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const DEMO_PHOTOS = [
  'blake-woolwine-023anTXoe0Q-unsplash.jpg',
  'huy-nguyen-AB-q9lwCVv8-unsplash.jpg',
  'izabelle-wilding-HcyFtJqiT-0-unsplash.jpg',
  'lotus-design-n-print-cnXTU42C0sg-unsplash.jpg',
  'lotus-design-n-print-WDUtNbot6Qw-unsplash.jpg',
  'mahmoud-azmy-MPd1Vcdvg1w-unsplash.jpg',
];

const DEMO_LISTINGS = [
  {
    title: `${DEMO_TAG} Downtown Studio Loft`,
    description: 'Fully furnished studio near metro with smart lock access, dedicated work corner, and weekly housekeeping add-on.',
    locationText: 'Connaught Place, New Delhi',
    budget: 26500,
    moveInDate: new Date('2026-04-10'),
    status: 'Published',
    amenities: ['WiFi', 'Air Conditioning', 'Housekeeping', '24x7 Security'],
    inventoryTemplate: [{ item: 'Bed Frame' }, { item: 'Mattress' }, { item: 'Wardrobe' }, { item: 'Desk Chair' }],
    imageIndexes: [0, 1, 2],
  },
  {
    title: `${DEMO_TAG} Co-Living Premium Room`,
    description: 'Private room in a managed co-living block with shared kitchen, lounge access, and app-based maintenance support.',
    locationText: 'HSR Layout, Bengaluru',
    budget: 19800,
    moveInDate: new Date('2026-04-20'),
    status: 'Published',
    amenities: ['High-Speed Internet', 'Power Backup', 'Laundry', 'Gym Access'],
    inventoryTemplate: [{ item: 'Study Table' }, { item: 'Chair' }, { item: 'Storage Unit' }, { item: 'Curtains' }],
    imageIndexes: [2, 3, 4],
  },
  {
    title: `${DEMO_TAG} Family Apartment 2BHK`,
    description: 'Bright 2BHK apartment with balcony, covered parking, and quick access to schools, grocery, and public transport.',
    locationText: 'Baner, Pune',
    budget: 34200,
    moveInDate: new Date('2026-05-01'),
    status: 'Published',
    amenities: ['Parking', 'Balcony', 'Lift', 'Gated Community'],
    inventoryTemplate: [{ item: 'Sofa Set' }, { item: 'Dining Table' }, { item: 'Refrigerator' }, { item: 'Water Purifier' }],
    imageIndexes: [1, 4, 5],
  },
];

const getMediaBucket = () => {
  if (!mongoose.connection?.db) {
    throw new Error('MongoDB connection is not ready');
  }

  return new GridFSBucket(mongoose.connection.db, { bucketName: MEDIA_BUCKET_NAME });
};

const guessMimeType = (filePath) => MIME_BY_EXTENSION[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

const normalizeUploadsPathToAbsolute = (storedPath) => {
  const trimmed = String(storedPath || '').trim();
  if (!trimmed) {
    return null;
  }

  if (path.isAbsolute(trimmed)) {
    return trimmed;
  }

  const withoutLeadingSlash = trimmed.replace(/^\/+/, '');
  const fromWorkspace = path.resolve(process.cwd(), '..', withoutLeadingSlash);
  if (fs.existsSync(fromWorkspace)) {
    return fromWorkspace;
  }

  const fromBackend = path.resolve(process.cwd(), withoutLeadingSlash);
  if (fs.existsSync(fromBackend)) {
    return fromBackend;
  }

  return null;
};

const uploadFileToGridFs = async (sourcePath, metadata = {}, originalNameOverride = null) => {
  const stats = await fsPromises.stat(sourcePath);
  const mimeType = guessMimeType(sourcePath);
  const originalName = originalNameOverride || path.basename(sourcePath);
  const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${originalName}`;
  const bucket = getMediaBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(storedName, {
      contentType: mimeType,
      metadata,
    });

    const readStream = fs.createReadStream(sourcePath);

    readStream.on('error', reject);
    uploadStream.on('error', reject);

    uploadStream.on('finish', () => {
      const mediaId = String(uploadStream.id);
      resolve({
        mediaId,
        storedName,
        originalName,
        mimeType,
        size: stats.size,
        path: getMediaPath(mediaId),
      });
    });

    readStream.pipe(uploadStream);
  });
};

const migrateLegacyListingImages = async () => {
  const listings = await Listing.find({ 'images.0': { $exists: true } });
  let touchedListings = 0;
  let migratedImages = 0;

  for (const listing of listings) {
    let changed = false;
    const nextImages = [];

    for (const image of listing.images || []) {
      const mediaId = String(image.mediaId || '').trim();

      if (mediaId) {
        const canonicalPath = getMediaPath(mediaId);
        if (image.path !== canonicalPath) {
          changed = true;
        }

        nextImages.push({
          ...image.toObject(),
          mediaId,
          path: canonicalPath,
        });
        continue;
      }

      const imagePath = String(image.path || '').trim();
      const looksLikeLegacyUpload = imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/');

      if (!looksLikeLegacyUpload) {
        nextImages.push(image.toObject());
        continue;
      }

      const absoluteLegacyPath = normalizeUploadsPathToAbsolute(imagePath);
      if (!absoluteLegacyPath) {
        console.warn(`Could not find legacy image on disk: ${imagePath} (listing ${listing._id})`);
        nextImages.push(image.toObject());
        continue;
      }

      const uploaded = await uploadFileToGridFs(
        absoluteLegacyPath,
        {
          kind: 'listing-image-migration',
          listingId: String(listing._id),
          sourcePath: imagePath,
        },
        image.originalName || path.basename(absoluteLegacyPath)
      );

      nextImages.push({
        ...image.toObject(),
        mediaId: uploaded.mediaId,
        storedName: uploaded.storedName,
        originalName: uploaded.originalName,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        path: uploaded.path,
      });

      changed = true;
      migratedImages += 1;
    }

    if (changed) {
      listing.images = nextImages;
      await listing.save();
      touchedListings += 1;
    }
  }

  return { touchedListings, migratedImages };
};

const resolveDemoPhotoPaths = async () => {
  const frontendPublicPath = path.resolve(process.cwd(), '..', 'frontend', 'public');
  const resolved = [];

  for (const filename of DEMO_PHOTOS) {
    const filePath = path.resolve(frontendPublicPath, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required demo image not found: ${filePath}`);
    }
    resolved.push(filePath);
  }

  return resolved;
};

const getSeederIdentity = async () => {
  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 }).lean();
  if (admin?.clerkId) {
    return admin.clerkId;
  }

  return 'seed-script-admin';
};

const createDemoListings = async () => {
  const existingCount = await Listing.countDocuments({ title: { $regex: `^${DEMO_TAG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` } });
  if (existingCount > 0) {
    return { created: 0, skipped: DEMO_LISTINGS.length };
  }

  const photoPaths = await resolveDemoPhotoPaths();
  const createdBy = await getSeederIdentity();
  let created = 0;

  for (const definition of DEMO_LISTINGS) {
    const uploadedImages = [];
    for (const photoIndex of definition.imageIndexes) {
      const sourcePath = photoPaths[photoIndex];
      const uploaded = await uploadFileToGridFs(sourcePath, {
        kind: 'listing-image-demo-seed',
        source: 'frontend/public',
        demoTag: DEMO_TAG,
      });
      uploadedImages.push({
        ...uploaded,
        altText: `${definition.title} image`,
        caption: '',
      });
    }

    await Listing.create({
      title: definition.title,
      description: definition.description,
      locationText: definition.locationText,
      budget: definition.budget,
      moveInDate: definition.moveInDate,
      status: definition.status,
      createdBy,
      amenities: definition.amenities,
      inventoryTemplate: definition.inventoryTemplate,
      images: uploadedImages,
    });

    created += 1;
  }

  return { created, skipped: 0 };
};

const run = async () => {
  await connectDB();

  const migrationResult = await migrateLegacyListingImages();
  const seedResult = await createDemoListings();

  console.log('Migration summary:', migrationResult);
  console.log('Seed summary:', seedResult);
};

run()
  .catch((error) => {
    console.error('Script failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
