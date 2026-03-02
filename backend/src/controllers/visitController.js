const VisitRequest = require('../models/VisitRequest');
const Listing = require('../models/Listing');

// Terminal states — visit workflow is done once it reaches any of these
const TERMINAL_STATES = ['Interested', 'NotInterested', 'Cancelled'];

// Admin-only transitions
const ADMIN_TRANSITIONS = {
  Requested: ['Scheduled'],
  Scheduled: ['Visited'],
  Visited: ['Interested', 'NotInterested'],
  CancelRequested: ['Cancelled'],
};

// Tenant-only transitions (cancel request)
const TENANT_TRANSITIONS = {
  Requested: ['CancelRequested'],
  Scheduled: ['CancelRequested'],
};

// Tenant creates a visit request
const createVisitRequest = async (req, res, next) => {
  try {
    const { listingId, requestedDate, tenantNotes } = req.body;

    if (!listingId || !requestedDate) {
      return res.status(400).json({
        success: false,
        message: 'listingId and requestedDate are required',
      });
    }

    // Verify listing exists and is published
    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== 'Published') {
      return res.status(404).json({
        success: false,
        message: 'Published listing not found',
      });
    }

    // Check for active visit on same listing by same tenant
    const activeVisit = await VisitRequest.findOne({
      listing: listingId,
      tenant: req.user.clerkId,
      status: { $nin: TERMINAL_STATES },
    });

    if (activeVisit) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active visit request for this listing. Complete or cancel it first.',
      });
    }

    const visit = await VisitRequest.create({
      listing: listingId,
      tenant: req.user.clerkId,
      requestedDate,
      tenantNotes: tenantNotes || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Visit request created',
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};

// Tenant views own visit requests
const getMyVisitRequests = async (req, res, next) => {
  try {
    const visits = await VisitRequest.find({ tenant: req.user.clerkId })
      .populate('listing', 'title locationText budget moveInDate status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: visits.length,
      data: visits,
    });
  } catch (error) {
    next(error);
  }
};

// Admin views all visit requests
const getAllVisitRequests = async (req, res, next) => {
  try {
    const { status, listingId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (listingId) filter.listing = listingId;

    const visits = await VisitRequest.find(filter)
      .populate('listing', 'title locationText budget moveInDate status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: visits.length,
      data: visits,
    });
  } catch (error) {
    next(error);
  }
};

// Admin updates visit status (schedule, mark visited, set decision)
const adminUpdateVisitStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, scheduledDate, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    const visit = await VisitRequest.findById(id);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }

    // Validate admin transition
    const allowed = ADMIN_TRANSITIONS[visit.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition: ${visit.status} -> ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      });
    }

    // Scheduling requires a date
    if (status === 'Scheduled') {
      if (!scheduledDate) {
        return res.status(400).json({
          success: false,
          message: 'scheduledDate is required when scheduling a visit',
        });
      }
      visit.scheduledDate = scheduledDate;
    }

    if (adminNotes !== undefined) visit.adminNotes = adminNotes;
    visit.status = status;

    await visit.save();

    return res.status(200).json({
      success: true,
      message: `Visit status updated to ${status}`,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};

// Tenant requests cancellation
const tenantRequestCancel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const visit = await VisitRequest.findById(id);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }

    // Only the owning tenant can cancel
    if (visit.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Not your visit request' });
    }

    // Validate tenant transition
    const allowed = TENANT_TRANSITIONS[visit.status] || [];
    if (!allowed.includes('CancelRequested')) {
      return res.status(400).json({
        success: false,
        message: `Cannot request cancellation from status: ${visit.status}`,
      });
    }

    visit.status = 'CancelRequested';
    await visit.save();

    return res.status(200).json({
      success: true,
      message: 'Cancellation requested. Admin will confirm.',
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVisitRequest,
  getMyVisitRequests,
  getAllVisitRequests,
  adminUpdateVisitStatus,
  tenantRequestCancel,
};
