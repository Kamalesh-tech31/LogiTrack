const Order = require("../models/Order");
const Product = require("../models/product");
const User = require("../models/User");
const { createOrderEventNotifications } = require("../services/notificationService");
const fs = require("fs");
const path = require("path");

// File logging for debugging
const logToFile = (message) => {
  const logPath = path.join(__dirname, "../../order-debug.log");
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch {}
};

// Helper to generate orderId
const generateOrderId = () =>
  `ORD-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;

// Create order with automatic delivery creation
exports.createOrder = async (req, res, next) => {
  try {
    const { userId, items, deliveryAddress } = req.body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "userId and items are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
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

      if (!productId || !quantity || quantity < 1) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid item in order" });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      if (!ownerId) ownerId = product.ownerId;

      await Product.updateOne(
        { _id: product._id },
        { $inc: { stock: -quantity } },
      );

      const price = product.price;
      total += price * quantity;
      orderItems.push({ product: product._id, quantity, price });
    }

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

    const savedOrder = await order.save();
    await createOrderEventNotifications(savedOrder, "created");

    res.status(201).json({ success: true, data: savedOrder });
  } catch (err) {
    logToFile(`ORDER CREATION ERROR: ${err.message}`);
    next(err);
  }
};

// Get all orders scoped to authenticated user relationship
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
      .populate("customerId", "fullName email phone phoneNumber");

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
    const ownerId = req.user?.id || req.user?._id;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orders = await Order.find({ ownerId })
      .sort({ createdAt: -1 })
      .populate("items.product", "name price images ownerId")
      .populate("customerId", "fullName email phone phoneNumber");

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
    const customerId = req.user?.id || req.user?._id;
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
      .populate("customerId", "fullName email phone phoneNumber");

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

    await createOrderEventNotifications(order, status);

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

    if (order.status !== "delivered") {
      await createOrderEventNotifications(order, "cancelled");
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
