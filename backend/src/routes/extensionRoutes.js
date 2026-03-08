const express = require('express');
const {
  createExtensionRequest,
  cancelExtensionRequest,
  getMyExtensions,
  getEligibleMoveIns,
  getAllExtensions,
  adminDecideExtension,
} = require('../controllers/extensionController');
const {
  authenticate,
  attachUser,
  requireAdmin,
  requireTenant,
} = require('../middleware/authMiddleware');

const router = express.Router();

// Tenant routes
router.post('/', authenticate, attachUser, requireTenant, createExtensionRequest);
router.get('/mine', authenticate, attachUser, requireTenant, getMyExtensions);
router.get('/eligible', authenticate, attachUser, requireTenant, getEligibleMoveIns);
router.patch('/:id/cancel', authenticate, attachUser, requireTenant, cancelExtensionRequest);

// Admin routes
router.get('/', authenticate, attachUser, requireAdmin, getAllExtensions);
router.patch('/:id/decide', authenticate, attachUser, requireAdmin, adminDecideExtension);

module.exports = router;
