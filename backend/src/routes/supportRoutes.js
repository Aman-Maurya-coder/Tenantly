const express = require('express');
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketStats,
  getTicketById,
  addMessage,
  adminUpdateStatus,
  tenantReopenTicket,
} = require('../controllers/supportController');
const {
  authenticate,
  attachUser,
  requireAdmin,
  requireTenant,
} = require('../middleware/authMiddleware');

const router = express.Router();

// Tenant routes
router.post('/', authenticate, attachUser, requireTenant, createTicket);
router.get('/mine', authenticate, attachUser, requireTenant, getMyTickets);
router.patch('/:id/reopen', authenticate, attachUser, requireTenant, tenantReopenTicket);

// Admin routes
router.get('/', authenticate, attachUser, requireAdmin, getAllTickets);
router.get('/stats', authenticate, attachUser, requireAdmin, getTicketStats);
router.patch('/:id/status', authenticate, attachUser, requireAdmin, adminUpdateStatus);

// Shared routes (RBAC inside controller)
router.get('/:id', authenticate, attachUser, getTicketById);
router.post('/:id/message', authenticate, attachUser, addMessage);

module.exports = router;
