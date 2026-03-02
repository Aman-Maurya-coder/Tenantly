const express = require('express');
const {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
} = require('../controllers/listingController');
const { authenticate, attachUser, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (no auth required)
router.get('/', getAllListings);
router.get('/:id', getListingById);

// Admin-only routes (auth + admin role required)
router.post('/', authenticate, attachUser, requireAdmin, createListing);
router.put('/:id', authenticate, attachUser, requireAdmin, updateListing);
router.delete('/:id', authenticate, attachUser, requireAdmin, deleteListing);

module.exports = router;
