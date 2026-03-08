const mongoose = require('mongoose');

const inventoryTemplateItemSchema = new mongoose.Schema(
  {
    item: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
  },
  { _id: true }
);

const listingImageSchema = new mongoose.Schema(
  {
    mediaId: {
      type: String,
      trim: true,
      default: null,
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
    altText: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
  },
  { _id: true }
);

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    locationText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    moveInDate: {
      type: Date,
      required: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Draft', 'Review', 'Published'],
      default: 'Draft',
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    inventoryTemplate: {
      type: [inventoryTemplateItemSchema],
      default: [],
    },
    images: {
      type: [listingImageSchema],
      default: [],
    },
    reservedForTenant: {
      type: String,
      default: null,
      trim: true,
    },
    reservationVisit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VisitRequest',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

listingSchema.virtual('coverImage').get(function getCoverImage() {
  return Array.isArray(this.images) && this.images.length > 0 ? this.images[0] : null;
});

module.exports = mongoose.model('Listing', listingSchema);
