const mongoose = require("mongoose");

const TrackingEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "Pending",
        "Assigned",
        "Out for Delivery",
        "Delivered",
        "Failed Attempt",
        "Returned",
      ],
      default: "Pending",
    },
    tracking: {
      type: [TrackingEntrySchema],
      default: [],
    },
    estimatedDelivery: {
      type: Date,
    },
    priority: {
      type: String,
      required: false,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    lastUpdated: {
      type: String,
      default: "Just now",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Delivery", deliverySchema, "delivery");
