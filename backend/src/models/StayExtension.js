const mongoose = require('mongoose');

const stayExtensionSchema = new mongoose.Schema(
  {
    tenant: {
      type: String,
      required: true,
      trim: true,
    },
    moveIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MoveIn',
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    currentEndDate: {
      type: Date,
      required: true,
    },
    requestedEndDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// One active (pending) extension per move-in at a time
stayExtensionSchema.index({ moveIn: 1, status: 1 });

module.exports = mongoose.model('StayExtension', stayExtensionSchema);
