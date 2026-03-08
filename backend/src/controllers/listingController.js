const Listing = require('../models/Listing');
const User = require('../models/User');

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

const normalizeInventoryTemplate = (inventoryTemplate) => {
  if (!Array.isArray(inventoryTemplate)) {
    return [];
  }

  return inventoryTemplate
    .map((entry) => (typeof entry === 'string' ? entry : entry?.item))
    .map((item) => (item || '').trim())
    .filter(Boolean)
    .map((item) => ({ item }));
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
  const isReserved = Boolean(listingData.reservedForTenant);
  const isOwnedByCurrentTenant = tenantId && listingData.reservedForTenant === tenantId;
  const isUnavailableToCurrentTenant = isReserved && !isOwnedByCurrentTenant;

  return {
    ...listingData,
    reservation: {
      isReserved,
      reservedForCurrentTenant: Boolean(isOwnedByCurrentTenant),
      unavailableToCurrentTenant: Boolean(isUnavailableToCurrentTenant),
    },
  };
};

const createListing = async (req, res, next) => {
  try {
    const { title, description, locationText, budget, moveInDate, inventoryTemplate } = req.body;

    if (!title || !description || !locationText || budget === undefined || !moveInDate) {
      return res.status(400).json({
        success: false,
        message: 'title, description, locationText, budget, and moveInDate are required',
      });
    }

    const listing = await Listing.create({
      title,
      description,
      locationText,
      budget,
      moveInDate,
      status: 'Draft',
      createdBy: req.user.clerkId,
      inventoryTemplate: normalizeInventoryTemplate(inventoryTemplate),
    });

    return res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: listing,
    });
  } catch (error) {
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
  try {
    const { id } = req.params;
    const {
      title,
      description,
      locationText,
      budget,
      moveInDate,
      status,
      inventoryTemplate,
      reservedForTenant,
      reservationVisit,
    } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

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
    if (inventoryTemplate !== undefined) {
      listing.inventoryTemplate = normalizeInventoryTemplate(inventoryTemplate);
    }
    if (reservedForTenant !== undefined) {
      listing.reservedForTenant = reservedForTenant || null;
    }
    if (reservationVisit !== undefined) {
      listing.reservationVisit = reservationVisit || null;
    }

    await listing.save();

    return res.status(200).json({
      success: true,
      message: 'Listing updated successfully',
      data: listing,
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
  updateListing,
  deleteListing,
};
