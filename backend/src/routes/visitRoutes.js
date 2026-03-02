const express = require('express');
const {
  createVisitRequest,
  getMyVisitRequests,
  getAllVisitRequests,
  adminUpdateVisitStatus,
  tenantRequestCancel,
} = require('../controllers/visitController');
const {
  authenticate,
  attachUser,
  requireAdmin,
  requireTenant,
} = require('../middleware/authMiddleware');

const router = express.Router();

// Tenant routes
router.post('/', authenticate, attachUser, requireTenant, createVisitRequest);
router.get('/mine', authenticate, attachUser, requireTenant, getMyVisitRequests);
router.patch('/:id/cancel', authenticate, attachUser, requireTenant, tenantRequestCancel);

// Admin routes
router.get('/', authenticate, attachUser, requireAdmin, getAllVisitRequests);
router.patch('/:id/status', authenticate, attachUser, requireAdmin, adminUpdateVisitStatus);

module.exports = router;
