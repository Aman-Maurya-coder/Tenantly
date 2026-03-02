const mongoose = require('mongoose');

const shortlistSchema = new mongoose.Schema(
  {
    tenant: {
      type: String,
      required: true,
      trim: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
  },
  { timestamps: true }
);

// One shortlist entry per tenant per listing
shortlistSchema.index({ tenant: 1, listing: 1 }, { unique: true });

module.exports = mongoose.model('Shortlist', shortlistSchema);
