const mongoose = require('mongoose');

const visitRequestSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    tenant: {
      type: String,
      required: true,
      trim: true,
    },
    requestedDate: {
      type: Date,
      required: true,
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    tenantNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'Requested',
        'Scheduled',
        'Visited',
        'Interested',
        'NotInterested',
        'CancelRequested',
        'Cancelled',
      ],
      default: 'Requested',
    },
  },
  { timestamps: true }
);

// One active visit per tenant per listing at a time
visitRequestSchema.index({ listing: 1, tenant: 1 });

module.exports = mongoose.model('VisitRequest', visitRequestSchema);
