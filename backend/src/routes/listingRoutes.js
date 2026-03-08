const express = require('express');
const {
  createListing,
  getAllListings,
  getListingById,
  getListingStats,
  updateListing,
  deleteListing,
} = require('../controllers/listingController');
const { authenticate, attachUser, requireAdmin } = require('../middleware/authMiddleware');
const { listingUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public routes (no auth required)
router.get('/', getAllListings);
router.get('/stats', authenticate, attachUser, requireAdmin, getListingStats);
router.get('/:id', getListingById);

// Admin-only routes (auth + admin role required)
router.post('/', authenticate, attachUser, requireAdmin, listingUpload.array('images', 8), createListing);
router.put('/:id', authenticate, attachUser, requireAdmin, listingUpload.array('images', 8), updateListing);
router.delete('/:id', authenticate, attachUser, requireAdmin, deleteListing);

module.exports = router;
