const mongoose = require("mongoose")

const CustomerProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    deliveryTime: {
      type: String,
      trim: true,
      default: "2-4 days",
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("CustomerProduct", CustomerProductSchema)
