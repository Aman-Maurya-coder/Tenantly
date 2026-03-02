const express = require('express');
const User = require('../models/User');

const router = express.Router();

// DEV ONLY: Promote a user to admin by email
router.patch('/promote', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Not available in production' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'email is required' });
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. They must sign in at least once first.' });
    }

    return res.status(200).json({ success: true, message: `${email} promoted to admin`, data: user });
  } catch (error) {
    next(error);
  }
});

// Get current user profile (for frontend to know role)
const { authenticate, attachUser } = require('../middleware/authMiddleware');
router.get('/me', authenticate, attachUser, (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      clerkId: req.user.clerkId,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    },
  });
});

module.exports = router;
