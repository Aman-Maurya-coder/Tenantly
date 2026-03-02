const express = require('express');
const {
  addToShortlist,
  removeFromShortlist,
  getMyShortlist,
  compareListings,
} = require('../controllers/shortlistController');
const { authenticate, attachUser, requireTenant } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are tenant-only
router.use(authenticate, attachUser, requireTenant);

router.post('/', addToShortlist);
router.get('/', getMyShortlist);
router.delete('/:listingId', removeFromShortlist);
router.get('/compare', compareListings);

module.exports = router;
