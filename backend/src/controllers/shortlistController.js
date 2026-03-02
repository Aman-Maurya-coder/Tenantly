const Shortlist = require('../models/Shortlist');
const Listing = require('../models/Listing');

const MAX_SHORTLIST = 10;
const MAX_COMPARE = 3;

// Add a listing to shortlist
const addToShortlist = async (req, res, next) => {
  try {
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({ success: false, message: 'listingId is required' });
    }

    // Verify listing exists and is published
    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== 'Published') {
      return res.status(404).json({ success: false, message: 'Published listing not found' });
    }

    // Check if already shortlisted
    const existing = await Shortlist.findOne({ tenant: req.user.clerkId, listing: listingId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Listing already shortlisted' });
    }

    // Check max shortlist cap
    const count = await Shortlist.countDocuments({ tenant: req.user.clerkId });
    if (count >= MAX_SHORTLIST) {
      return res.status(400).json({
        success: false,
        message: `Shortlist limit reached (max ${MAX_SHORTLIST}). Remove a listing first.`,
      });
    }

    const entry = await Shortlist.create({
      tenant: req.user.clerkId,
      listing: listingId,
    });

    return res.status(201).json({
      success: true,
      message: 'Listing added to shortlist',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

// Remove a listing from shortlist
const removeFromShortlist = async (req, res, next) => {
  try {
    const { listingId } = req.params;

    const entry = await Shortlist.findOneAndDelete({
      tenant: req.user.clerkId,
      listing: listingId,
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Listing not in your shortlist' });
    }

    return res.status(200).json({
      success: true,
      message: 'Listing removed from shortlist',
    });
  } catch (error) {
    next(error);
  }
};

// View own shortlist
const getMyShortlist = async (req, res, next) => {
  try {
    const entries = await Shortlist.find({ tenant: req.user.clerkId })
      .populate('listing', 'title description locationText budget moveInDate amenities status')
      .sort({ createdAt: -1 });

    // Filter out any listings that are no longer published
    const active = entries.filter((e) => e.listing && e.listing.status === 'Published');

    return res.status(200).json({
      success: true,
      count: active.length,
      data: active,
    });
  } catch (error) {
    next(error);
  }
};

// Compare 2-3 shortlisted listings side-by-side (real-time read)
const compareListings = async (req, res, next) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ success: false, message: 'ids query param is required (comma-separated listing IDs)' });
    }

    const listingIds = ids.split(',').map((id) => id.trim()).filter(Boolean);

    if (listingIds.length < 2 || listingIds.length > MAX_COMPARE) {
      return res.status(400).json({
        success: false,
        message: `Provide 2 to ${MAX_COMPARE} listing IDs to compare`,
      });
    }

    // Verify all are in the tenant's shortlist
    const shortlisted = await Shortlist.find({
      tenant: req.user.clerkId,
      listing: { $in: listingIds },
    });

    const shortlistedIds = shortlisted.map((s) => s.listing.toString());
    const notShortlisted = listingIds.filter((id) => !shortlistedIds.includes(id));

    if (notShortlisted.length > 0) {
      return res.status(400).json({
        success: false,
        message: `These listings are not in your shortlist: ${notShortlisted.join(', ')}`,
      });
    }

    // Fetch full listing details
    const listings = await Listing.find({
      _id: { $in: listingIds },
      status: 'Published',
    }).select('title description locationText budget moveInDate amenities createdAt');

    if (listings.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Not enough published listings found for comparison',
      });
    }

    return res.status(200).json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToShortlist,
  removeFromShortlist,
  getMyShortlist,
  compareListings,
};
