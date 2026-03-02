const { clerkClient, requireAuth } = require('@clerk/express');
const User = require('../models/User');

// Clerk JWT verification middleware
const authenticate = requireAuth();

// Attach our DB user to req after Clerk auth passes
const attachUser = async (req, res, next) => {
  try {
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    let user = await User.findOne({ clerkId });

    // Auto-create user record on first authenticated request
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      user = await User.create({
        clerkId,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        role: 'tenant',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Role guard: admin only
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Role guard: tenant only
const requireTenant = (req, res, next) => {
  if (!req.user || req.user.role !== 'tenant') {
    return res.status(403).json({ success: false, message: 'Tenant access required' });
  }
  next();
};

module.exports = {
  authenticate,
  attachUser,
  requireAdmin,
  requireTenant,
};
