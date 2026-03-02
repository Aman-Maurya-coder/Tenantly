const SupportTicket = require('../models/SupportTicket');

// Admin status transitions
const ADMIN_TRANSITIONS = {
  open: ['in_progress'],
  in_progress: ['resolved'],
  resolved: ['closed', 'in_progress'],
  reopened: ['in_progress'],
  closed: [],
};

// Tenant can only reopen a resolved ticket
const TENANT_TRANSITIONS = {
  resolved: ['reopened'],
};

// ---------- tenant: create ticket ----------

const createTicket = async (req, res, next) => {
  try {
    const { subject, category, message, relatedListingId, relatedMoveInId } = req.body;

    if (!subject || !category || !message) {
      return res.status(400).json({
        success: false,
        message: 'subject, category, and message are required',
      });
    }

    const ticket = await SupportTicket.create({
      tenant: req.user.clerkId,
      subject,
      category,
      relatedListing: relatedListingId || null,
      relatedMoveIn: relatedMoveInId || null,
      messages: [
        {
          senderId: req.user.clerkId,
          senderRole: 'tenant',
          message,
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Ticket created',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// ---------- tenant: get own tickets ----------

const getMyTickets = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filter = { tenant: req.user.clerkId };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const tickets = await SupportTicket.find(filter)
      .populate('relatedListing', 'title locationText')
      .populate('relatedMoveIn', 'status')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    next(error);
  }
};

// ---------- admin: get all tickets ----------

const getAllTickets = async (req, res, next) => {
  try {
    const { status, category, sortBy } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    let sort = { updatedAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };

    const tickets = await SupportTicket.find(filter)
      .populate('relatedListing', 'title locationText')
      .populate('relatedMoveIn', 'status')
      .sort(sort);

    return res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    next(error);
  }
};

// ---------- admin: dashboard stats ----------

const getTicketStats = async (req, res, next) => {
  try {
    const [total, open, inProgress, resolved, closed, reopened] = await Promise.all([
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in_progress' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
      SupportTicket.countDocuments({ status: 'closed' }),
      SupportTicket.countDocuments({ status: 'reopened' }),
    ]);

    // Average first-response time (open tickets with at least one admin reply)
    const ticketsWithAdminReply = await SupportTicket.find({
      'messages.senderRole': 'admin',
    }).lean();

    let totalResponseMs = 0;
    let respondedCount = 0;

    for (const ticket of ticketsWithAdminReply) {
      const created = new Date(ticket.createdAt).getTime();
      const firstAdminMsg = ticket.messages.find((m) => m.senderRole === 'admin');
      if (firstAdminMsg) {
        totalResponseMs += new Date(firstAdminMsg.createdAt).getTime() - created;
        respondedCount++;
      }
    }

    const avgResponseMinutes = respondedCount > 0 ? Math.round(totalResponseMs / respondedCount / 60000) : null;

    return res.status(200).json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        resolved,
        closed,
        reopened,
        unresolved: open + inProgress + reopened,
        avgFirstResponseMinutes: avgResponseMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- shared: get single ticket ----------

const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id)
      .populate('relatedListing', 'title locationText')
      .populate('relatedMoveIn', 'status');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Tenant can only see own tickets
    if (req.user.role !== 'admin' && ticket.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

// ---------- shared: add message (threaded reply) ----------

const addMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Tenant can only reply to own tickets
    if (req.user.role !== 'admin' && ticket.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Cannot reply to closed tickets
    if (ticket.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cannot reply to a closed ticket' });
    }

    ticket.messages.push({
      senderId: req.user.clerkId,
      senderRole: req.user.role,
      message,
    });

    // Auto-transition: open → in_progress on first admin reply
    if (req.user.role === 'admin' && ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    // Auto-transition: reopened → in_progress on admin reply
    if (req.user.role === 'admin' && ticket.status === 'reopened') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: 'Reply added',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// ---------- admin: update ticket status ----------

const adminUpdateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const allowed = ADMIN_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition: ${ticket.status} -> ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      });
    }

    ticket.status = status;
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// ---------- tenant: reopen ticket ----------

const tenantReopenTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.tenant !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: 'Not your ticket' });
    }

    const allowed = TENANT_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes('reopened')) {
      return res.status(400).json({
        success: false,
        message: `Cannot reopen from status: ${ticket.status}. Ticket must be resolved.`,
      });
    }

    ticket.status = 'reopened';
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: 'Ticket reopened',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketStats,
  getTicketById,
  addMessage,
  adminUpdateStatus,
  tenantReopenTicket,
};
