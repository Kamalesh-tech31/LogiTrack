const Order = require("../models/Order");
const Product = require("../models/product");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// File logging for debugging
const logToFile = (message) => {
  const logPath = path.join(__dirname, "../../order-debug.log");
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
};

// Helper to generate orderId
const generateOrderId = () =>
  `ORD-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;

// Create order with automatic delivery creation
exports.createOrder = async (req, res, next) => {
  try {
    const { userId, items, deliveryAddress } = req.body;
    logToFile("=== ORDER CREATION START ===");
    logToFile(`User ID: ${userId}`);
    logToFile(`Items: ${JSON.stringify(items, null, 2)}`);
    logToFile(`Delivery Address: ${JSON.stringify(deliveryAddress, null, 2)}`);
    console.log("=== ORDER CREATION START ===");
    console.log("User ID:", userId);
    console.log("Items:", JSON.stringify(items, null, 2));
    console.log("Delivery Address:", JSON.stringify(deliveryAddress, null, 2));

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      logToFile("VALIDATION ERROR: Missing userId or items");
      console.log("VALIDATION ERROR: Missing userId or items");
      return res
        .status(400)
        .json({ success: false, message: "userId and items are required" });
    }

    const user = await User.findById(userId);
    logToFile(`Customer lookup: ${user ? "FOUND" : "NOT FOUND"}`);
    console.log("Customer:", user);
    if (!user) {
      logToFile("USER NOT FOUND - returning 404");
      console.log("USER NOT FOUND");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Validate products and calculate total
    let total = 0;
    const orderItems = [];
    let ownerId = null;

    for (const it of items) {
      const { productId, quantity } = it;
      logToFile(
        `Processing item: productId=${productId}, quantity=${quantity}`,
      );
      console.log(
        "Processing item - Product selected:",
        productId,
        "Quantity:",
        quantity,
      );

      if (!productId || !quantity || quantity < 1) {
        logToFile("INVALID ITEM - productId or quantity missing");
        console.log("INVALID ITEM - productId or quantity missing");
        return res
          .status(400)
          .json({ success: false, message: "Invalid item in order" });
      }

      const product = await Product.findById(productId);
      logToFile(
        `Product lookup result: ${product ? product.name : "NOT FOUND"}`,
      );
      console.log(
        "Product lookup result:",
        product ? product.name : "NOT FOUND",
      );

      if (!product) {
        logToFile(`PRODUCT NOT FOUND for ID: ${productId}`);
        console.log("PRODUCT NOT FOUND for ID:", productId);
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      if (product.stock < quantity) {
        logToFile(
          `INSUFFICIENT STOCK for ${product.name}: ${product.stock} < required ${quantity}`,
        );
        console.log(
          "INSUFFICIENT STOCK:",
          product.stock,
          "< required:",
          quantity,
        );
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      // Track owner ID from first product
      if (!ownerId) ownerId = product.ownerId;

      // reduce stock using an atomic update to avoid validating any missing product fields
      const updatedStock = product.stock - quantity;
      await Product.updateOne(
        { _id: product._id },
        { $inc: { stock: -quantity } },
      );
      logToFile(
        `Stock reduced for product ${product.name}: new stock=${updatedStock}`,
      );
      console.log(
        "Stock reduced for product:",
        product.name,
        "New stock:",
        updatedStock,
      );

      const price = product.price;
      total += price * quantity;
      orderItems.push({ product: product._id, quantity, price });
    }

    logToFile(
      `Creating order; total=${total}, customerName=${user.fullName}, items=${JSON.stringify(orderItems)}`,
    );
    console.log("Creating order with:");
    console.log("  orderId:", generateOrderId());
    console.log("  customerId:", userId);
    console.log("  ownerId:", ownerId);
    console.log("  customerName:", user.fullName);
    console.log("  items:", JSON.stringify(orderItems, null, 2));
    console.log("  totalPrice:", total);
    console.log("  deliveryAddress:", JSON.stringify(deliveryAddress, null, 2));

    const orderId = generateOrderId();
    const order = new Order({
      orderId,
      customerId: userId,
      ownerId,
      customerName: user.fullName,
      items: orderItems,
      totalPrice: total,
      deliveryAddress: deliveryAddress || {},
      status: "pending",
    });

    logToFile(
      `Order document before save: ${JSON.stringify(order.toObject())}`,
    );
    console.log("Order document before save:", JSON.stringify(order, null, 2));
    const savedOrder = await order.save();
    logToFile(
      `Order saved successfully: ${JSON.stringify(savedOrder.toObject())}`,
    );
    console.log(
      "Order saved successfully:",
      JSON.stringify(savedOrder, null, 2),
    );

    // Note: Delivery documents are deprecated. Use Order.assignedAgent/status
    // as the single source of truth for delivery assignment and lifecycle.

    res.status(201).json({ success: true, data: savedOrder });
  } catch (err) {
    logToFile(`ORDER CREATION ERROR: ${err.message}`);
    logToFile(
      `Error details: ${JSON.stringify({ message: err.message, stack: err.stack }, null, 2)}`,
    );
    console.error("ORDER CREATION ERROR:", err.message);
    console.error("Error details:", err);
    next(err);
  }
};

// Get all orders scoped to the authenticated user's relationship
exports.getOrders = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const role = req.user?.role;
    const filter = {};

    if (role === "Customer") {
      filter.customerId = userId;
    } else if (role === "Business Owner" || role === "Owner") {
      filter.ownerId = userId;
    } else if (role === "Delivery Agent") {
      filter.$or = [
        { assignedAgent: userId },
        { assignedAgent: { $exists: false } },
        { assignedAgent: null },
      ];
    } else {
      filter.$or = [
        { customerId: userId },
        { ownerId: userId },
        { assignedAgent: userId },
      ];
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("items.product", "name price images")
      .populate("customerId", "fullName email");

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// Get business owner orders (for their products)
exports.getBusinessOrders = async (req, res, next) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orders = await Order.find({ ownerId })
      .sort({ createdAt: -1 })
      .populate("items.product", "name price images ownerId")
      .populate("customerId", "fullName email phone");

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// Get customer's orders
exports.getCustomerOrders = async (req, res, next) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orders = await Order.find({ customerId })
      .sort({ createdAt: -1 })
      .populate("items.product", "name price images");

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// Get order by id with relationship authorization
exports.getOrderById = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const order = await Order.findById(req.params.id)
      .populate("items.product", "name price images")
      .populate("customerId", "fullName email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const role = req.user?.role;
    const orderCustomerId = order.customerId?._id
      ? String(order.customerId._id)
      : String(order.customerId || "");
    const orderOwnerId = order.ownerId?._id
      ? String(order.ownerId._id)
      : String(order.ownerId || "");
    const orderAssignedAgent = order.assignedAgent?._id
      ? String(order.assignedAgent._id)
      : String(order.assignedAgent || "");

    const isCustomer = orderCustomerId && orderCustomerId === String(userId);
    const isOwner = orderOwnerId && orderOwnerId === String(userId);
    const isAssignedAgent =
      orderAssignedAgent && orderAssignedAgent === String(userId);
    const isClaimableAgent =
      !order.assignedAgent && role === "Delivery Agent";

    if (!isCustomer && !isOwner && !isAssignedAgent && !isClaimableAgent) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = [
      "pending",
      "processing",
      "assigned",
      "out-for-delivery",
      "shipped",
      "completed",
      "delivered",
      "failed",
      "returned",
      "cancelled",
    ];
    if (!allowed.includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });

    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    order.status = status;
    if (status === "out-for-delivery" || status === "shipped")
      order.shippedAt = new Date();
    if (status === "delivered" || status === "completed")
      order.deliveredAt = new Date();
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// Delete order (and optionally restock if not delivered)
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // If order not delivered, return stock
    if (order.status !== "delivered") {
      for (const it of order.items) {
        await Product.findByIdAndUpdate(it.product, {
          $inc: { stock: it.quantity },
        });
      }
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Order deleted" });
  } catch (err) {
    next(err);
  }
};
