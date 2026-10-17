const mongoose = require("mongoose")

const LocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
)

const WaypointSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
)

const DeliveryTrackingSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerOrder",
      required: true,
    },
    origin: {
      type: LocationSchema,
      required: true,
    },
    destination: {
      type: LocationSchema,
      required: true,
    },
    currentPosition: {
      type: LocationSchema,
      required: true,
    },
    waypoints: {
      type: [WaypointSchema],
      default: [],
    },
    status: {
      type: String,
      trim: true,
      default: "in-transit",
    },
    estimatedDelivery: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("DeliveryTracking", DeliveryTrackingSchema)
