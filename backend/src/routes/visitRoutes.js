const express = require('express');
const {
  createVisitRequest,
  getMyVisitRequests,
  getAllVisitRequests,
  getVisitStats,
  adminUpdateVisitStatus,
  tenantRequestCancel,
  tenantMarkVisited,
  tenantSetInterest,
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
router.patch('/:id/visited', authenticate, attachUser, requireTenant, tenantMarkVisited);
router.patch('/:id/interest', authenticate, attachUser, requireTenant, tenantSetInterest);

// Admin routes
router.get('/', authenticate, attachUser, requireAdmin, getAllVisitRequests);
router.get('/stats', authenticate, attachUser, requireAdmin, getVisitStats);
router.patch('/:id/status', authenticate, attachUser, requireAdmin, adminUpdateVisitStatus);

module.exports = router;
