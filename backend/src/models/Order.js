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
    street: { type: String, trim: true },
    fullAddress: { type: String, trim: true },
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
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
    completionPhoto: {
      type: String,
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
