const mongoose = require('mongoose');

const documentSubSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const inventoryItemSchema = new mongoose.Schema(
  {
    item: {
      type: String,
      required: true,
      trim: true,
    },
    condition: {
      type: String,
      enum: ['good', 'minor_damage', 'needs_repair'],
      required: true,
    },
    confirmedByTenant: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  { _id: true }
);

const moveInSchema = new mongoose.Schema(
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
    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VisitRequest',
      required: true,
    },
    documents: {
      type: [documentSubSchema],
      default: [],
    },
    agreementConfirmed: {
      type: Boolean,
      default: false,
    },
    agreementConfirmedAt: {
      type: Date,
      default: null,
    },
    inventoryChecklist: {
      type: [inventoryItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['initiated', 'completed'],
      default: 'initiated',
    },
  },
  { timestamps: true }
);

// One move-in per tenant per visit
moveInSchema.index({ tenant: 1, visit: 1 }, { unique: true });

module.exports = mongoose.model('MoveIn', moveInSchema);
