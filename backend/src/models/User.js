const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["Business Owner", "Delivery Agent", "Customer"],
      required: true,
    },

    businessName: {
      type: String,
    },

    gstNumber: {
      type: String,
    },

    businessAddress: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    agentStatus: {
      type: String,
      enum: ["available", "on-delivery", "offline"],
      default: "available",
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
