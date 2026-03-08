const MoveIn = require('../models/MoveIn');
const VisitRequest = require('../models/VisitRequest');
const Listing = require('../models/Listing');
const path = require('path');

const REQUIRED_DOCUMENT_FIELDS = ['identityProof', 'addressProof', 'incomeProof'];
const VALID_CONDITIONS = ['good', 'minor_damage', 'needs_repair'];

const parseInventoryPayload = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }
  return null;
};

// ---------- tenant: initiate move-in ----------

const initiateMoveIn = async (req, res, next) => {
  try {
    const { visitId } = req.body;

    if (!visitId) {
      return res.status(400).json({ success: false, message: 'visitId is required' });
    }

    // Gate: visit must exist and decision must be Interested (accepted)
    const visit = await VisitRequest.findById(visitId);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }
    if (visit.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Not your visit request' });
    }
    if (visit.status !== 'Interested') {
      return res.status(400).json({
        success: false,
        message: 'Move-in cannot start without an accepted (Interested) visit decision',
      });
    }

    const listing = await Listing.findById(visit.listing);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    if (listing.reservedForTenant && listing.reservedForTenant !== req.user.clerkId) {
      return res.status(409).json({ success: false, message: 'Listing is reserved for another tenant' });
    }

    // One move-in per visit
    const existing = await MoveIn.findOne({ visit: visitId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Move-in already initiated for this visit' });
    }

    const moveIn = await MoveIn.create({
      tenant: req.user.clerkId,
      listing: visit.listing,
      visit: visitId,
    });

    return res.status(201).json({
      success: true,
      message: 'Move-in initiated',
      data: moveIn,
    });
  } catch (error) {
    next(error);
  }
};

// ---------- tenant: single submission with files ----------
const submitMoveIn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agreed } = req.body;
    const inventoryPayload = parseInventoryPayload(req.body.inventory);

    const moveIn = await MoveIn.findById(id);
    if (!moveIn) return res.status(404).json({ success: false, message: 'Move-in not found' });
    if (moveIn.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Not your move-in' });
    }
    if (moveIn.status !== 'initiated') {
      return res.status(400).json({ success: false, message: 'Move-in has already been submitted' });
    }

    if (!(agreed === true || agreed === 'true')) {
      return res.status(400).json({ success: false, message: 'Agreement must be accepted before submission' });
    }
    if (!Array.isArray(inventoryPayload)) {
      return res.status(400).json({ success: false, message: 'inventory must be a JSON array' });
    }

    const listing = await Listing.findById(moveIn.listing).select('inventoryTemplate reservedForTenant');
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.reservedForTenant && listing.reservedForTenant !== req.user.clerkId) {
      return res.status(409).json({ success: false, message: 'Listing is reserved for another tenant' });
    }

    const inventoryByItemId = new Map(
      inventoryPayload.map((entry) => [String(entry.itemId || ''), entry])
    );
    const hasTemplate = Array.isArray(listing.inventoryTemplate) && listing.inventoryTemplate.length > 0;
    if (hasTemplate) {
      const missingItems = listing.inventoryTemplate.filter((item) => !inventoryByItemId.has(String(item._id)));
      if (missingItems.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'All listing inventory items must be submitted with condition values',
        });
      }
    }

    const normalizedInventory = (listing.inventoryTemplate || []).map((item) => {
      const entry = inventoryByItemId.get(String(item._id));
      const condition = entry?.condition;
      if (!VALID_CONDITIONS.includes(condition)) {
        throw new Error(`Invalid condition for ${item.item}`);
      }
      return {
        item: item.item,
        condition,
        confirmedByTenant: true,
        notes: entry?.notes || '',
      };
    });

    const files = req.files || {};
    const missingDocuments = REQUIRED_DOCUMENT_FIELDS.filter((field) => !files[field] || files[field].length === 0);
    if (missingDocuments.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required documents: ${missingDocuments.join(', ')}`,
      });
    }

    const documents = REQUIRED_DOCUMENT_FIELDS.map((label) => {
      const [file] = files[label];
      return {
        label,
        storedName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: path.relative(process.cwd(), file.path).replace(/\\/g, '/'),
      };
    });

    moveIn.documents = documents;
    moveIn.status = 'completed';
    moveIn.agreementConfirmed = true;
    moveIn.agreementConfirmedAt = new Date();
    moveIn.inventoryChecklist = normalizedInventory;

    await moveIn.save();

    return res.status(200).json({
      success: true,
      message: 'Move-in submitted and completed',
      data: moveIn,
    });
  } catch (error) {
    if (error.message.startsWith('Invalid condition for')) {
      return res.status(400).json({ success: false, message: `${error.message}. Use good, minor_damage, or needs_repair.` });
    }
    next(error);
  }
};

// ---------- tenant: get own move-ins ----------

const getMyMoveIns = async (req, res, next) => {
  try {
    const moveIns = await MoveIn.find({ tenant: req.user.clerkId })
      .populate('listing', 'title locationText budget')
      .populate('visit', 'status scheduledDate')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: moveIns.length, data: moveIns });
  } catch (error) {
    next(error);
  }
};

// ---------- admin: get all move-ins ----------

const getAllMoveIns = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const moveIns = await MoveIn.find(filter)
      .populate('listing', 'title locationText budget')
      .populate('visit', 'status scheduledDate')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: moveIns.length, data: moveIns });
  } catch (error) {
    next(error);
  }
};

// ---------- get single move-in ----------

const getMoveInById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const moveIn = await MoveIn.findById(id)
      .populate('listing', 'title locationText budget amenities inventoryTemplate')
      .populate('visit', 'status scheduledDate');

    if (!moveIn) return res.status(404).json({ success: false, message: 'Move-in not found' });

    // Tenant can only see own; admin can see all
    if (req.user.role !== 'admin' && moveIn.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, data: moveIn });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateMoveIn,
  submitMoveIn,
  getMyMoveIns,
  getAllMoveIns,
  getMoveInById,
};
