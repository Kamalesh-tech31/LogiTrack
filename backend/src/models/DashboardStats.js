const mongoose = require("mongoose")

const DashboardStatsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    totalOrders: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    items: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    pending: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    revenue: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("DashboardStats", DashboardStatsSchema)
