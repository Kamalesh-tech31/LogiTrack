const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {

    ownerId: 
    {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    images: [{ type: String }],
    category: { type: String, default: 'general' },
    sku: { type: String, index: true },
    tags: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 5, min: 0 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);
