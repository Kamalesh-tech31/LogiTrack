const mongoose = require("mongoose")

const OrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerProduct",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
)

const CustomerOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["delivered", "shipped", "pending"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    items: {
      type: [OrderItemSchema],
      default: [],
    },
    shippingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.orderId
        ret.customer = ret.customerName
        delete ret._id
        delete ret.__v
        delete ret.orderId
        delete ret.customerName
        return ret
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.orderId
        ret.customer = ret.customerName
        delete ret._id
        delete ret.__v
        delete ret.orderId
        delete ret.customerName
        return ret
      },
    },
  }
)

module.exports = mongoose.model("CustomerOrder", CustomerOrderSchema)
