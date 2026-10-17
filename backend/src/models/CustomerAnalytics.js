const mongoose = require("mongoose")

const TrendPointSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
)

const CategoryDistributionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
)

const CustomerAnalyticsSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      trim: true,
      default: "monthly",
    },
    totalRevenue: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalOrders: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    itemsSold: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    activeCustomers: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    revenueTrend: {
      type: [TrendPointSchema],
      default: [],
    },
    ordersTrend: {
      type: [TrendPointSchema],
      default: [],
    },
    categoryDistribution: {
      type: [CategoryDistributionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("CustomerAnalytics", CustomerAnalyticsSchema)
