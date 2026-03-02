const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      enum: ['tenant', 'admin'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    tenant: {
      type: String,
      required: true,
      trim: true,
    },
    relatedListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      default: null,
    },
    relatedMoveIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MoveIn',
      default: null,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    category: {
      type: String,
      enum: ['visit', 'move-in', 'listing', 'general'],
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed', 'reopened'],
      default: 'open',
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

supportTicketSchema.index({ tenant: 1, status: 1 });
supportTicketSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
