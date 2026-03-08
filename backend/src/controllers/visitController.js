const VisitRequest = require('../models/VisitRequest');
const Listing = require('../models/Listing');

// Terminal states — visit workflow is done once it reaches any of these
const TERMINAL_STATES = ['Interested', 'NotInterested', 'Cancelled'];

// Admin-only transitions
const ADMIN_TRANSITIONS = {
  Requested: ['Scheduled'],
  CancelRequested: ['Cancelled'],
};

const TENANT_CANCEL_TRANSITIONS = {
  Requested: ['CancelRequested'],
  Scheduled: ['CancelRequested'],
};

const TENANT_VISIT_TRANSITIONS = {
  Scheduled: ['Visited'],
};

const TENANT_DECISION_TRANSITIONS = {
  Visited: ['Interested', 'NotInterested'],
};

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
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
    if (listing.moveInDate < getStartOfToday()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request a visit for an expired listing',
      });
    }
    if (listing.reservedForTenant && listing.reservedForTenant !== req.user.clerkId) {
      return res.status(409).json({
        success: false,
        message: 'Listing is reserved for another tenant',
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

// Admin updates visit status (schedule and cancel confirmation only)
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
    const allowed = TENANT_CANCEL_TRANSITIONS[visit.status] || [];
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

// Tenant marks a scheduled visit as visited
const tenantMarkVisited = async (req, res, next) => {
  try {
    const { id } = req.params;

    const visit = await VisitRequest.findById(id);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }
    if (visit.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Not your visit request' });
    }

    const allowed = TENANT_VISIT_TRANSITIONS[visit.status] || [];
    if (!allowed.includes('Visited')) {
      return res.status(400).json({
        success: false,
        message: `Cannot mark visited from status: ${visit.status}`,
      });
    }

    visit.status = 'Visited';
    await visit.save();

    return res.status(200).json({
      success: true,
      message: 'Visit marked as visited',
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};

// Tenant decides interest after visit
const tenantSetInterest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Interested', 'NotInterested'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be Interested or NotInterested' });
    }

    const visit = await VisitRequest.findById(id);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }
    if (visit.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Not your visit request' });
    }

    const allowed = TENANT_DECISION_TRANSITIONS[visit.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot set ${status} from status: ${visit.status}`,
      });
    }

    const listing = await Listing.findById(visit.listing);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (status === 'Interested') {
      if (listing.reservedForTenant && listing.reservedForTenant !== req.user.clerkId) {
        return res.status(409).json({
          success: false,
          message: 'Listing is already reserved for another tenant',
        });
      }
      listing.reservedForTenant = req.user.clerkId;
      listing.reservationVisit = visit._id;
      await listing.save();
    }

    if (status === 'NotInterested' && listing.reservedForTenant === req.user.clerkId) {
      listing.reservedForTenant = null;
      listing.reservationVisit = null;
      await listing.save();
    }

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

module.exports = {
  createVisitRequest,
  getMyVisitRequests,
  getAllVisitRequests,
  adminUpdateVisitStatus,
  tenantRequestCancel,
  tenantMarkVisited,
  tenantSetInterest,
};
