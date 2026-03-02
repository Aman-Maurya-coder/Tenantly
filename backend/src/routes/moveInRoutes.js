const express = require('express');
const {
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
} = require('../controllers/moveInController');
const {
  authenticate,
  attachUser,
  requireAdmin,
  requireTenant,
} = require('../middleware/authMiddleware');

const router = express.Router();

// Tenant routes
router.post('/', authenticate, attachUser, requireTenant, initiateMoveIn);
router.get('/mine', authenticate, attachUser, requireTenant, getMyMoveIns);
router.patch('/:id/documents', authenticate, attachUser, requireTenant, uploadDocuments);
router.patch('/:id/agreement', authenticate, attachUser, requireTenant, confirmAgreement);
router.patch('/:id/inventory/confirm', authenticate, attachUser, requireTenant, confirmInventory);

// Admin routes
router.get('/', authenticate, attachUser, requireAdmin, getAllMoveIns);
router.patch('/:id/documents/verify', authenticate, attachUser, requireAdmin, verifyDocuments);
router.patch('/:id/inventory', authenticate, attachUser, requireAdmin, addInventoryItems);
router.patch('/:id/complete', authenticate, attachUser, requireAdmin, markCompleted);

// Shared (RBAC inside controller)
router.get('/:id', authenticate, attachUser, getMoveInById);

module.exports = router;
