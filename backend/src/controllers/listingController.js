const Listing = require('../models/Listing');
const User = require('../models/User');
const {
  deleteStoredAssets,
  getMediaPath,
  persistUploadedFilesToMedia,
} = require('../services/mediaStorage');

// Valid status transitions: Draft -> Review -> Published (no skipping)
const VALID_TRANSITIONS = {
  Draft: ['Review'],
  Review: ['Published', 'Draft'],
  Published: ['Draft'],
};

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const parseStructuredValue = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    return value;
  }
};

const normalizeStringArray = (value) => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = parseStructuredValue(value);

  if (Array.isArray(parsed)) {
    return parsed.map((entry) => String(entry || '').trim()).filter(Boolean);
  }

  if (typeof parsed === 'string') {
    return parsed
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeInventoryTemplate = (inventoryTemplate) => {
  if (inventoryTemplate === undefined) {
    return undefined;
  }

  const parsed = parseStructuredValue(inventoryTemplate);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((entry) => (typeof entry === 'string' ? entry : entry?.item))
    .map((item) => (item || '').trim())
    .filter(Boolean)
    .map((item) => ({ item }));
};

const normalizeIdentifierArray = (value) => {
  if (value === undefined) {
    return [];
  }

  const parsed = parseStructuredValue(value);

  if (Array.isArray(parsed)) {
    return parsed.map((entry) => String(entry || '').trim()).filter(Boolean);
  }

  if (typeof parsed === 'string' && parsed.trim()) {
    return [parsed.trim()];
  }

  return [];
};

const normalizeListingImages = (images) => {
  if (images === undefined) {
    return undefined;
  }

  const parsed = parseStructuredValue(images);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((image) => image && (typeof image.path === 'string' || typeof image.mediaId === 'string'))
    .map((image) => {
      const mediaId = String(image.mediaId || '').trim();

      return {
        mediaId: mediaId || null,
      storedName: String(image.storedName || '').trim(),
      originalName: String(image.originalName || '').trim(),
      mimeType: String(image.mimeType || '').trim(),
      size: Number(image.size || 0),
      // Canonicalize to DB-backed media route whenever mediaId exists.
      path: mediaId ? getMediaPath(mediaId) : String(image.path || '').trim(),
      altText: String(image.altText || '').trim(),
      caption: String(image.caption || '').trim(),
    };
    })
    .filter((image) => image.storedName && image.originalName && image.mimeType && image.path);
};

const normalizeListingImagesForResponse = (images = []) => images.map((image) => {
  const mediaId = String(image?.mediaId || '').trim();
  if (!mediaId) {
    return image;
  }

  return {
    ...image,
    path: getMediaPath(mediaId),
  };
});

const reorderImagesByCoverReference = (images, coverImageRef) => {
  const nextImages = (images || []).map((image) => ({ ...image }));

  if (!coverImageRef) {
    return nextImages.map(({ clientKey, ...image }) => image);
  }

  const [referenceType, referenceValue] = String(coverImageRef).split(':');
  const selectedIndex = nextImages.findIndex((image) => {
    if (referenceType === 'existing') {
      return image.path === referenceValue || image.mediaId === referenceValue;
    }

    if (referenceType === 'new') {
      return image.clientKey === referenceValue;
    }

    return image.path === coverImageRef || image.mediaId === coverImageRef;
  });

  if (selectedIndex <= 0) {
    return nextImages.map(({ clientKey, ...image }) => image);
  }

  const [selectedImage] = nextImages.splice(selectedIndex, 1);
  return [selectedImage, ...nextImages].map(({ clientKey, ...image }) => image);
};

const persistListingImages = async (files, newImageKeys, uploadedBy) => {
  const storedFiles = await persistUploadedFilesToMedia(files, (file, index) => ({
    kind: 'listing-image',
    uploadedBy,
    originalName: file.originalname,
    clientKey: newImageKeys[index] || null,
  }));

  return storedFiles.map((file, index) => ({
    ...file,
    altText: '',
    caption: '',
    clientKey: newImageKeys[index] || null,
  }));
};

const getRoleAndTenant = async (req) => {
  if (!req.auth?.userId) {
    return { role: null, tenantId: null };
  }

  const dbUser = await User.findOne({ clerkId: req.auth.userId }).select('role clerkId');
  return {
    role: dbUser?.role || null,
    tenantId: dbUser?.clerkId || req.auth.userId,
  };
};

const withReservationState = (listing, tenantId) => {
  const listingData = listing.toObject();
  const normalizedImages = normalizeListingImagesForResponse(listingData.images || []);
  const isReserved = Boolean(listingData.reservedForTenant);
  const isOwnedByCurrentTenant = tenantId && listingData.reservedForTenant === tenantId;
  const isUnavailableToCurrentTenant = isReserved && !isOwnedByCurrentTenant;

  return {
    ...listingData,
    images: normalizedImages,
    coverImage: normalizedImages[0] || null,
    reservation: {
      isReserved,
      reservedForCurrentTenant: Boolean(isOwnedByCurrentTenant),
      unavailableToCurrentTenant: Boolean(isUnavailableToCurrentTenant),
    },
  };
};

const createListing = async (req, res, next) => {
  let uploadedImages = [];

  try {
    const { title, description, locationText, budget, moveInDate } = req.body;
    const amenities = normalizeStringArray(req.body.amenities);
    const inventoryTemplate = normalizeInventoryTemplate(req.body.inventoryTemplate);
    const coverImageRef = req.body.coverImageRef;
    const newImageKeys = normalizeIdentifierArray(req.body.newImageKeys);

    if (!title || !description || !locationText || budget === undefined || !moveInDate) {
      return res.status(400).json({
        success: false,
        message: 'title, description, locationText, budget, and moveInDate are required',
      });
    }

    uploadedImages = await persistListingImages(req.files || [], newImageKeys, req.user?.clerkId || null);

    const listing = await Listing.create({
      title,
      description,
      locationText,
      budget,
      moveInDate,
      status: 'Draft',
      createdBy: req.user.clerkId,
      amenities: amenities || [],
      inventoryTemplate: inventoryTemplate || [],
      images: reorderImagesByCoverReference(uploadedImages, coverImageRef),
    });

    return res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: listing,
    });
  } catch (error) {
    await deleteStoredAssets(uploadedImages);
    next(error);
  }
};

const getAllListings = async (req, res, next) => {
  try {
    const { locationText, minBudget, maxBudget, moveInDate } = req.query;
    const filter = {};
    const { role, tenantId } = await getRoleAndTenant(req);

    // Public browse only sees published listings unless admin
    if (role !== 'admin') {
      filter.status = 'Published';
      filter.moveInDate = { ...(filter.moveInDate || {}), $gte: getStartOfToday() };
    }

    if (locationText) {
      filter.locationText = { $regex: locationText, $options: 'i' };
    }
    if (minBudget) {
      filter.budget = { ...filter.budget, $gte: Number(minBudget) };
    }
    if (maxBudget) {
      filter.budget = { ...filter.budget, $lte: Number(maxBudget) };
    }
    if (moveInDate) {
      filter.moveInDate = { ...(filter.moveInDate || {}), $lte: new Date(moveInDate) };
    }

    const listings = await Listing.find(filter).sort({ createdAt: -1 });
    const responseListings = listings.map((listing) => withReservationState(listing, tenantId));

    return res.status(200).json({
      success: true,
      count: responseListings.length,
      data: responseListings,
    });
  } catch (error) {
    next(error);
  }
};

const getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    const { role, tenantId } = await getRoleAndTenant(req);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Non-admin can only see published and non-expired listings
    const isExpired = listing.moveInDate < getStartOfToday();
    if ((listing.status !== 'Published' || isExpired) && role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    return res.status(200).json({ success: true, data: withReservationState(listing, tenantId) });
  } catch (error) {
    next(error);
  }
};

const updateListing = async (req, res, next) => {
  let uploadedImages = [];

  try {
    const { id } = req.params;
    const {
      title,
      description,
      locationText,
      budget,
      moveInDate,
      status,
      reservedForTenant,
      reservationVisit,
      coverImageRef,
    } = req.body;
    const amenities = normalizeStringArray(req.body.amenities);
    const inventoryTemplate = normalizeInventoryTemplate(req.body.inventoryTemplate);
    const retainedImages = normalizeListingImages(req.body.retainedImages);
    const newImageKeys = normalizeIdentifierArray(req.body.newImageKeys);

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    uploadedImages = await persistListingImages(req.files || [], newImageKeys, req.user?.clerkId || null);

    // Status transition validation
    if (status && status !== listing.status) {
      const allowedNext = VALID_TRANSITIONS[listing.status] || [];
      if (!allowedNext.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition: ${listing.status} -> ${status}. Allowed: ${allowedNext.join(', ') || 'none'}`,
        });
      }
    }

    // Update allowed fields
    if (title !== undefined) listing.title = title;
    if (description !== undefined) listing.description = description;
    if (locationText !== undefined) listing.locationText = locationText;
    if (budget !== undefined) listing.budget = budget;
    if (moveInDate !== undefined) listing.moveInDate = moveInDate;
    if (status !== undefined) listing.status = status;
    if (amenities !== undefined) {
      listing.amenities = amenities;
    }
    if (inventoryTemplate !== undefined) {
      listing.inventoryTemplate = inventoryTemplate;
    }
    if (reservedForTenant !== undefined) {
      listing.reservedForTenant = reservedForTenant || null;
    }
    if (reservationVisit !== undefined) {
      listing.reservationVisit = reservationVisit || null;
    }

    if (retainedImages !== undefined || uploadedImages.length > 0) {
      const nextImages = [
        ...(retainedImages !== undefined ? retainedImages : listing.images),
        ...uploadedImages,
      ];

      const removedAssets = (listing.images || []).filter((existingImage) => (
        !nextImages.some((image) => (
          image.path === existingImage.path || (image.mediaId && image.mediaId === existingImage.mediaId)
        ))
      ));

      listing.images = reorderImagesByCoverReference(nextImages, coverImageRef);
      await listing.save();
      await deleteStoredAssets(removedAssets);

      return res.status(200).json({
        success: true,
        message: 'Listing updated successfully',
        data: listing,
      });
    }

    await listing.save();

    return res.status(200).json({
      success: true,
      message: 'Listing updated successfully',
      data: listing,
    });
  } catch (error) {
    await deleteStoredAssets(uploadedImages);
    next(error);
  }
};

const getListingStats = async (_req, res, next) => {
  try {
    const startOfToday = getStartOfToday();
    const [total, draft, review, published, reserved, available] = await Promise.all([
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'Draft' }),
      Listing.countDocuments({ status: 'Review' }),
      Listing.countDocuments({ status: 'Published' }),
      Listing.countDocuments({ reservedForTenant: { $ne: null } }),
      Listing.countDocuments({
        status: 'Published',
        reservedForTenant: null,
        moveInDate: { $gte: startOfToday },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        draft,
        review,
        published,
        reserved,
        available,
        summary: {
          key: 'listings',
          label: 'Listings',
          total,
          metrics: [
            { key: 'draft', label: 'Draft', value: draft },
            { key: 'review', label: 'Review', value: review },
            { key: 'published', label: 'Published', value: published },
            { key: 'reserved', label: 'Reserved', value: reserved },
            { key: 'available', label: 'Available', value: available },
          ],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    await deleteStoredAssets(listing.images || []);
    await Listing.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createListing,
  getAllListings,
  getListingById,
  getListingStats,
  updateListing,
  deleteListing,
};
