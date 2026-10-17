const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const DeliveryAddressSchema = new mongoose.Schema(
  {
    doorNo: { type: String, trim: true },
    street: { type: String, trim: true },
    area: { type: String, trim: true },
    fullAddress: { type: String, trim: true },
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true, default: "India" },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customerName: {
      type: String,
      required: true,
    },
    items: { type: [OrderItemSchema], required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    pickupAddress: { type: DeliveryAddressSchema },
    deliveryAddress: { type: DeliveryAddressSchema },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "assigned",
        "shipped",
        "out-for-delivery",
        "completed",
        "delivered",
        "failed",
        "returned",
        "cancelled",
      ],
      default: "pending",
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    batchId: {
      type: String,
      default: null,
    },
    sequenceOrder: {
      type: Number,
      default: null,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    deliveryStage: {
      type: String,
      enum: [
        "UNCLAIMED",
        "TO_WAREHOUSE",
        "AT_WAREHOUSE",
        "TO_CUSTOMER",
        "AT_CUSTOMER",
        "OTP_REQUESTED",
        "DELIVERED",
      ],
      default: "UNCLAIMED",
    },
    agentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      speed: { type: Number, default: null },
      heading: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    customerVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    deliveryOtp: {
      codeHash: {
        type: String,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      attempts: {
        type: Number,
        default: 0,
      },
      createdAt: {
        type: Date,
        default: null,
      },
    },
    completionPhoto: {
      type: String,
      default: null,
    },
    completionOtpHash: {
      type: String,
      default: null,
    },
    completionOtpExpiresAt: {
      type: Date,
      default: null,
    },
    completionOtpSentAt: {
      type: Date,
      default: null,
    },
    completionOtpAttempts: {
      type: Number,
      default: 0,
    },
    completionOtpVerified: {
      type: Boolean,
      default: false,
    },
    completionOtpUsedAt: {
      type: Date,
      default: null,
    },
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", OrderSchema);
