const Product = require("../models/product");
const InventoryHistory = require("../models/InventoryHistory");
const { createRoleNotification } = require("../services/notificationService");

function isLowStock(product) {
  return (
    typeof product.stock === "number" &&
    typeof product.minStock === "number" &&
    product.stock < product.minStock
  );
}

// Create a new product
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      images,
      category,
      sku,
      tags,
      stock,
      minStock,
    } = req.body;

    if (!name || price == null) {
      return res
        .status(400)
        .json({ success: false, message: "Name and price are required" });
    }

    const product = new Product({
      name,
      description,
      price,
      images,
      category,
      sku,
      tags,
      stock,
      minStock,
      ownerId: req.user.id,
    });
    await product.save();

    await InventoryHistory.create({
      ownerId: req.user.id,
      productId: product._id,
      productName: product.name,
      action: `Created product ${product.name}`,
      quantity: product.stock || 0,
      details: "New product added to inventory",
    });

    await createRoleNotification({
      recipient: req.user.id,
      recipientRole: "Business Owner",
      type: "product-added",
      title: "Product added",
      message: `${product.name} was added to your catalog.`,
      orderId: null,
      orderCode: null,
      metadata: {
        status: isLowStock(product) ? "low-stock" : "active",
      },
    });

    if (isLowStock(product)) {
      await createRoleNotification({
        recipient: req.user.id,
        recipientRole: "Business Owner",
        type: "product-stock-low",
        title: "Product stock low",
        message: `${product.name} is below the minimum stock threshold.`,
        metadata: {
          stock: product.stock,
          minStock: product.minStock,
        },
      });
    }

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// Get list of products with optional query filters
exports.getProducts = async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice, inStock } = req.query;
    const filter = {};

    if (q)
      filter.$or = [
        { name: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
      ];
    if (category) filter.category = category;
    if (minPrice)
      filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    if (maxPrice)
      filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
    if (inStock === "true") filter.stock = { $gt: 0 };

    const products = await Product.find({
      ...filter,
      ownerId: req.user.id,
      isActive: true,
    }).sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

// Get single product by id
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// Update product
exports.updateProduct = async (req, res, next) => {
  try {
    const updates = req.body;
    // Prevent setting negative stock
    if (updates.stock != null && updates.stock < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Stock cannot be negative" });
    }

    const original = await Product.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });
    if (!original)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      updates,
      { new: true, runValidators: true },
    );
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    if (typeof updates.stock === "number" && updates.stock !== original.stock) {
      await InventoryHistory.create({
        ownerId: req.user.id,
        productId: product._id,
        productName: product.name,
        action: `Updated stock of ${product.name}`,
        quantity: updates.stock - original.stock,
        details: `Stock changed from ${original.stock} to ${updates.stock}`,
      });
    }

    const originalLowStock = isLowStock(original);
    const updatedLowStock = isLowStock(product);

    if (updates.name && updates.name !== original.name) {
      await InventoryHistory.create({
        ownerId: req.user.id,
        productId: product._id,
        productName: product.name,
        action: `Renamed product from ${original.name} to ${product.name}`,
        quantity: 0,
        details: "Product metadata updated",
      });
    }

    if (Object.keys(updates).length > 0) {
      await createRoleNotification({
        recipient: req.user.id,
        recipientRole: "Business Owner",
        type: "product-updated",
        title: "Product updated",
        message: `${product.name} was updated successfully.`,
        metadata: {
          updatedFields: Object.keys(updates),
        },
      });
    }

    if (!originalLowStock && updatedLowStock) {
      await createRoleNotification({
        recipient: req.user.id,
        recipientRole: "Business Owner",
        type: "product-stock-low",
        title: "Product stock low",
        message: `${product.name} is below the minimum stock threshold.`,
        metadata: {
          stock: product.stock,
          minStock: product.minStock,
        },
      });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// Delete product (soft-delete)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    // soft delete to preserve history
    product.isActive = false;
    await product.save();

    await InventoryHistory.create({
      ownerId: req.user.id,
      productId: product._id,
      productName: product.name,
      action: `Deleted product ${product.name}`,
      quantity: 0,
      details: "Product removed from inventory",
    });

    res.json({ success: true, message: "Product removed" });
  } catch (err) {
    next(err);
  }
};
