const Listing = require('../models/Listing');

// Valid status transitions: Draft -> Review -> Published (no skipping)
const VALID_TRANSITIONS = {
  Draft: ['Review'],
  Review: ['Published', 'Draft'],
  Published: ['Draft'],
};

const createListing = async (req, res, next) => {
  try {
    const { title, description, locationText, budget, moveInDate } = req.body;

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

    // Public browse only sees published listings unless admin
    if (!req.user || req.user.role !== 'admin') {
      filter.status = 'Published';
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
      filter.moveInDate = { $lte: new Date(moveInDate) };
    }

    const listings = await Listing.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch (error) {
    next(error);
  }
};

const getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Non-admin can only see published listings
    if (listing.status !== 'Published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    return res.status(200).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
};

const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, locationText, budget, moveInDate, status } = req.body;

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
