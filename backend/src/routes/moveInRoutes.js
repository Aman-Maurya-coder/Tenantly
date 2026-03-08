const express = require('express');
const {
  initiateMoveIn,
  submitMoveIn,
  getMyMoveIns,
  getAllMoveIns,
  getMoveInById,
} = require('../controllers/moveInController');
const { moveInUpload } = require('../middleware/uploadMiddleware');
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
router.patch(
  '/:id/submit',
  authenticate,
  attachUser,
  requireTenant,
  moveInUpload.fields([
    { name: 'identityProof', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'incomeProof', maxCount: 1 },
  ]),
  submitMoveIn
);

// Admin routes
router.get('/', authenticate, attachUser, requireAdmin, getAllMoveIns);

// Shared (RBAC inside controller)
router.get('/:id', authenticate, attachUser, getMoveInById);

module.exports = router;
