const mongoose = require('mongoose');

const DeliveryAgentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    vehicle: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryAgent', DeliveryAgentSchema);
