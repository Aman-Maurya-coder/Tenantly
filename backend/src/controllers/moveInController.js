const MoveIn = require('../models/MoveIn');
const VisitRequest = require('../models/VisitRequest');

// ---------- helpers ----------

const STATUS_ORDER = [
  'initiated',
  'documents_submitted',
  'agreement_confirmed',
  'inventory_completed',
  'completed',
];

const nextStatus = (current) => {
  const idx = STATUS_ORDER.indexOf(current);
  return idx >= 0 && idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
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

// ---------- tenant: upload documents ----------

const uploadDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { documents } = req.body; // [{ name, fileUrl }]

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ success: false, message: 'documents array is required' });
    }

    const moveIn = await MoveIn.findById(id);
    if (!moveIn) return res.status(404).json({ success: false, message: 'Move-in not found' });
    if (moveIn.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Not your move-in' });
    }
    if (moveIn.status !== 'initiated') {
      return res.status(400).json({ success: false, message: 'Documents can only be uploaded in initiated status' });
    }

    // Validate each document
    for (const doc of documents) {
      if (!doc.name || !doc.fileUrl) {
        return res.status(400).json({ success: false, message: 'Each document needs name and fileUrl' });
      }
    }

    moveIn.documents = documents.map((d) => ({ name: d.name, fileUrl: d.fileUrl, verified: false }));
    moveIn.status = 'documents_submitted';
    await moveIn.save();

    return res.status(200).json({
      success: true,
      message: 'Documents submitted',
      data: moveIn,
    });
  } catch (error) {
    next(error);
  }
};

// ---------- admin: verify documents ----------

const verifyDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { documentIds } = req.body; // array of document _id strings to mark verified

    const moveIn = await MoveIn.findById(id);
    if (!moveIn) return res.status(404).json({ success: false, message: 'Move-in not found' });
    if (moveIn.status !== 'documents_submitted') {
      return res.status(400).json({ success: false, message: 'Documents must be submitted before verification' });
    }

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'documentIds array is required' });
    }

    for (const docId of documentIds) {
      const doc = moveIn.documents.id(docId);
      if (doc) doc.verified = true;
    }

    await moveIn.save();

    return res.status(200).json({
      success: true,
      message: 'Documents verified',
      data: moveIn,
    });
  } catch (error) {
    next(error);
  }
};

// ---------- tenant: confirm agreement ----------

const confirmAgreement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agreed } = req.body;

    if (agreed !== true) {
      return res.status(400).json({ success: false, message: 'You must agree (agreed: true)' });
    }

    const moveIn = await MoveIn.findById(id);
    if (!moveIn) return res.status(404).json({ success: false, message: 'Move-in not found' });
    if (moveIn.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Not your move-in' });
    }
    if (moveIn.status !== 'documents_submitted') {
      return res.status(400).json({ success: false, message: 'Documents must be submitted first' });
    }

    // All docs must be verified before agreement
    const allVerified = moveIn.documents.length > 0 && moveIn.documents.every((d) => d.verified);
    if (!allVerified) {
      return res.status(400).json({ success: false, message: 'All documents must be verified by admin before agreement' });
    }

    moveIn.agreementConfirmed = true;
    moveIn.agreementConfirmedAt = new Date();
    moveIn.status = 'agreement_confirmed';
    await moveIn.save();

    return res.status(200).json({
      success: true,
      message: 'Agreement confirmed',
      data: moveIn,
    });
  } catch (error) {
    next(error);
  }
};

// ---------- admin: add inventory items ----------

const addInventoryItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // [{ item: "Bed" }, { item: "Fan" }, ...]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items array is required' });
    }

    const moveIn = await MoveIn.findById(id);
    if (!moveIn) return res.status(404).json({ success: false, message: 'Move-in not found' });
    if (moveIn.status !== 'agreement_confirmed') {
      return res.status(400).json({ success: false, message: 'Agreement must be confirmed before adding inventory' });
    }

    const inventoryItems = items.map((i) => ({
      item: i.item,
      condition: '',
      confirmedByTenant: false,
    }));

    moveIn.inventoryChecklist = inventoryItems;
    await moveIn.save();

    return res.status(200).json({
      success: true,
      message: 'Inventory items added',
      data: moveIn,
    });
  } catch (error) {
    next(error);
  }
};

// ---------- tenant: confirm inventory with conditions ----------

const confirmInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { inventory } = req.body; // [{ itemId, condition }]

    if (!inventory || !Array.isArray(inventory) || inventory.length === 0) {
      return res.status(400).json({ success: false, message: 'inventory array is required' });
    }

    const moveIn = await MoveIn.findById(id);
    if (!moveIn) return res.status(404).json({ success: false, message: 'Move-in not found' });
    if (moveIn.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Not your move-in' });
    }
    if (moveIn.status !== 'agreement_confirmed') {
      return res.status(400).json({ success: false, message: 'Agreement must be confirmed first' });
    }
    if (moveIn.inventoryChecklist.length === 0) {
      return res.status(400).json({ success: false, message: 'Admin has not added inventory items yet' });
    }

    // Map tenant responses
    for (const entry of inventory) {
      const item = moveIn.inventoryChecklist.id(entry.itemId);
      if (item) {
        if (!['good', 'minor_damage', 'needs_repair'].includes(entry.condition)) {
          return res.status(400).json({
            success: false,
            message: `Invalid condition for ${item.item}: ${entry.condition}. Use good, minor_damage, or needs_repair`,
          });
        }
        item.condition = entry.condition;
        item.confirmedByTenant = true;
      }
    }

    // Check if all items confirmed
    const allConfirmed = moveIn.inventoryChecklist.every((i) => i.confirmedByTenant);
    if (allConfirmed) {
      moveIn.status = 'inventory_completed';
    }

    await moveIn.save();

    return res.status(200).json({
      success: true,
      message: allConfirmed ? 'Inventory completed' : 'Inventory partially confirmed',
      data: moveIn,
    });
  } catch (error) {
    next(error);
  }
};

// ---------- admin: mark move-in completed ----------

const markCompleted = async (req, res, next) => {
  try {
    const { id } = req.params;

    const moveIn = await MoveIn.findById(id);
    if (!moveIn) return res.status(404).json({ success: false, message: 'Move-in not found' });
    if (moveIn.status !== 'inventory_completed') {
      return res.status(400).json({ success: false, message: 'Inventory must be completed before marking move-in done' });
    }

    moveIn.status = 'completed';
    await moveIn.save();

    return res.status(200).json({
      success: true,
      message: 'Move-in completed',
      data: moveIn,
    });
  } catch (error) {
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
      .populate('listing', 'title locationText budget amenities')
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
  uploadDocuments,
  verifyDocuments,
  confirmAgreement,
  addInventoryItems,
  confirmInventory,
  markCompleted,
  getMyMoveIns,
  getAllMoveIns,
  getMoveInById,
};
