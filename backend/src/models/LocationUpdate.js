const mongoose = require('mongoose');

const locationUpdateSchema = new mongoose.Schema(
  {
    deliveryId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      default: 'manual',
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    formattedAddress: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      default: 'Unknown city',
      trim: true,
    },
    state: {
      type: String,
      default: 'Unknown state',
      trim: true,
    },
    country: {
      type: String,
      default: 'Unknown country',
      trim: true,
    },
    postalCode: {
      type: String,
      default: 'N/A',
      trim: true,
    },
    timestamp: {
      type: String,
      default: () => new Date().toLocaleString(),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LocationUpdate', locationUpdateSchema);
