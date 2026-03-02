const mongoose = require('mongoose');

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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Listing', listingSchema);
