const StayExtension = require('../models/StayExtension');
const MoveIn = require('../models/MoveIn');

const LISTING_POPULATE_FIELDS = 'title locationText moveInDate images';

// ---------- tenant: create extension request ----------

const createExtensionRequest = async (req, res, next) => {
  try {
    const { moveInId, currentEndDate, requestedEndDate, reason } = req.body;

    if (!moveInId || !currentEndDate || !requestedEndDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'moveInId, currentEndDate, requestedEndDate, and reason are required',
      });
    }

    // Gate: move-in must exist, belong to tenant, and be completed
    const moveIn = await MoveIn.findById(moveInId);
    if (!moveIn) {
      return res.status(404).json({ success: false, message: 'Move-in not found' });
    }
    if (moveIn.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Not your move-in' });
    }
    if (moveIn.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Stay extension can only be requested after move-in is completed',
      });
    }

    // Validate dates
    if (new Date(requestedEndDate) <= new Date(currentEndDate)) {
      return res.status(400).json({
        success: false,
        message: 'requestedEndDate must be after currentEndDate',
      });
    }

    // One pending request at a time per move-in
    const activePending = await StayExtension.findOne({
      moveIn: moveInId,
      status: 'pending',
    });
    if (activePending) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending extension request for this move-in. Wait for it to be resolved or cancel it.',
      });
    }

    const extension = await StayExtension.create({
      tenant: req.user.clerkId,
      moveIn: moveInId,
      listing: moveIn.listing,
      currentEndDate,
      requestedEndDate,
      reason,
    });

    return res.status(201).json({
      success: true,
      message: 'Stay extension request created',
      data: extension,
    });
  } catch (error) {
    next(error);
  }
};

// ---------- tenant: cancel pending request ----------

const cancelExtensionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const extension = await StayExtension.findById(id);
    if (!extension) {
      return res.status(404).json({ success: false, message: 'Extension request not found' });
    }
    if (extension.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Not your extension request' });
    }
    if (extension.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled',
      });
    }

    extension.status = 'cancelled';
    await extension.save();

    return res.status(200).json({
      success: true,
      message: 'Extension request cancelled',
      data: extension,
    });
  } catch (error) {
    next(error);
  }
};

// ---------- tenant: view own extension requests ----------

const getMyExtensions = async (req, res, next) => {
  try {
    const extensions = await StayExtension.find({ tenant: req.user.clerkId })
      .populate('listing', LISTING_POPULATE_FIELDS)
      .populate('moveIn', 'status')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: extensions.length, data: extensions });
  } catch (error) {
    next(error);
  }
};

const getEligibleMoveIns = async (req, res, next) => {
  try {
    const moveIns = await MoveIn.find({ tenant: req.user.clerkId, status: 'completed' })
      .populate('listing', LISTING_POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: moveIns.length, data: moveIns });
  } catch (error) {
    next(error);
  }
};

// ---------- admin: view all extension requests ----------

const getAllExtensions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const extensions = await StayExtension.find(filter)
      .populate('listing', LISTING_POPULATE_FIELDS)
      .populate('moveIn', 'status')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: extensions.length, data: extensions });
  } catch (error) {
    next(error);
  }
};

const getExtensionStats = async (_req, res, next) => {
  try {
    const [total, pending, approved, rejected, cancelled] = await Promise.all([
      StayExtension.countDocuments(),
      StayExtension.countDocuments({ status: 'pending' }),
      StayExtension.countDocuments({ status: 'approved' }),
      StayExtension.countDocuments({ status: 'rejected' }),
      StayExtension.countDocuments({ status: 'cancelled' }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        cancelled,
        summary: {
          key: 'extensions',
          label: 'Extensions',
          total,
          metrics: [
            { key: 'pending', label: 'Pending', value: pending },
            { key: 'approved', label: 'Approved', value: approved },
            { key: 'rejected', label: 'Rejected', value: rejected },
            { key: 'cancelled', label: 'Cancelled', value: cancelled },
          ],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- admin: approve or reject ----------

const adminDecideExtension = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status must be approved or rejected',
      });
    }

    const extension = await StayExtension.findById(id);
    if (!extension) {
      return res.status(404).json({ success: false, message: 'Extension request not found' });
    }
    if (extension.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${extension.status}. Only pending requests can be decided.`,
      });
    }

    extension.status = status;
    await extension.save();

    return res.status(200).json({
      success: true,
      message: `Extension request ${status}`,
      data: extension,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExtensionRequest,
  cancelExtensionRequest,
  getMyExtensions,
  getEligibleMoveIns,
  getAllExtensions,
  getExtensionStats,
  adminDecideExtension,
};
