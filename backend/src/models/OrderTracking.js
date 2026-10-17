const mongoose = require("mongoose")

const TrackingStepSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["completed", "in-progress", "pending"],
      default: "pending",
    },
    timestamp: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
)

const OrderTrackingSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerOrder",
      required: true,
    },
    steps: {
      type: [TrackingStepSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("OrderTracking", OrderTrackingSchema)
