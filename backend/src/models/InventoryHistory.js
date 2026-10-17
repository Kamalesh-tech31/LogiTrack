const mongoose = require("mongoose");

const inventoryHistorySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    details: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("InventoryHistory", inventoryHistorySchema);
