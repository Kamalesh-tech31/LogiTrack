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

// Fetch inventory overview
exports.getInventory = async (req, res, next) => {
  try {
    const products = await Product.find({
      ownerId: req.user.id,
      isActive: true,
    }).select("name stock minStock price category");
    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
    res.json({
      success: true,
      count: products.length,
      totalItems,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// Fetch low stock items
exports.getLowStock = async (req, res, next) => {
  try {
    const low = await Product.find({
      ownerId: req.user.id,
      isActive: true,
      $expr: { $lt: ["$stock", "$minStock"] },
    }).select("name stock minStock");
    res.json({ success: true, count: low.length, data: low });
  } catch (err) {
    next(err);
  }
};
// Fetch inventory history
exports.getHistory = async (req, res, next) => {
  try {
    const entries = await InventoryHistory.find({ ownerId: req.user.id })
      .sort({ createdAt: -1 })
      .select("productName action quantity details createdAt");

    res.json({ success: true, count: entries.length, data: entries });
  } catch (err) {
    next(err);
  }
};
// Update stock levels (set or delta)
exports.updateStock = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { set, delta } = req.body;
    const product = await Product.findOne({
      _id: productId,
      ownerId: req.user.id,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    let action;
    let quantity = 0;

    if (typeof set === "number") {
      if (set < 0)
        return res
          .status(400)
          .json({ success: false, message: "Stock cannot be negative" });
      quantity = set - product.stock;
      action = `Set stock to ${set}`;
      product.stock = set;
    } else if (typeof delta === "number") {
      quantity = delta;
      action = delta >= 0 ? `Restocked ${delta}` : `Removed ${Math.abs(delta)}`;
      product.stock += delta;
      if (product.stock < 0) product.stock = 0;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "set or delta required" });
    }

    const wasLowStock = isLowStock(product);

    await product.save();

    if (!wasLowStock && isLowStock(product)) {
      await createRoleNotification({
        recipient: req.user.id,
        recipientRole: "Business Owner",
        type: "product-stock-low",
        title: "Product stock low",
        message: `${product.name} is below the minimum stock threshold.`,
        metadata: {
          stock: product.stock,
          minStock: product.minStock,
          action,
        },
      });
    }

    await InventoryHistory.create({
      ownerId: req.user.id,
      productId: product._id,
      productName: product.name,
      action,
      quantity,
      details: `Inventory stock update via API`,
    });

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};
