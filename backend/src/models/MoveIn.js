const mongoose = require('mongoose');

const documentSubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
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
      enum: ['good', 'minor_damage', 'needs_repair', ''],
      default: '',
    },
    confirmedByTenant: {
      type: Boolean,
      default: false,
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
      enum: [
        'initiated',
        'documents_submitted',
        'agreement_confirmed',
        'inventory_completed',
        'completed',
      ],
      default: 'initiated',
    },
  },
  { timestamps: true }
);

// One move-in per tenant per visit
moveInSchema.index({ tenant: 1, visit: 1 }, { unique: true });

module.exports = mongoose.model('MoveIn', moveInSchema);
