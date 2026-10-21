const mongoose = require("mongoose");
const OrderTracking = require("../models/OrderTracking");

const Order = require("../models/Order");

const resolveOrder = async (orderIdParam) => {
  if (!orderIdParam) return null;

  const cleanId = String(orderIdParam)
    .replace(/^(deliv_|track_)/, "")
    .replace(/^#/, "")
    .trim();

  if (!cleanId) return null;

  // 1. Try Order by ObjectId
  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    const order = await Order.findById(cleanId)
      .populate("customerId", "fullName email phone")
      .populate("assignedAgent", "fullName email role")
      .populate("ownerId", "fullName businessName phone");
    if (order) return { order, model: "Order" };
  }

  // 2. Try Order by exact orderId string
  const order = await Order.findOne({ orderId: cleanId })
    .populate("customerId", "fullName email phone")
    .populate("assignedAgent", "fullName email role")
    .populate("ownerId", "fullName businessName phone");
  if (order) return { order, model: "Order" };

  return null;
};

exports.getAllTrackings = async (req, res) => {
  try {
    const trackings = await OrderTracking.find().populate("order");
    res.status(200).json(trackings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tracking records",
      error: error.message,
    });
  }
};

exports.getTrackingByOrderId = async (req, res) => {
  try {
    const resolved = await resolveOrder(req.params.orderId);
    if (!resolved) {
      return res.status(404).json({ message: "Order not found" });
    }

    const { order } = resolved;
    const userId = String(req.user?.id || req.user?._id || "");

    const customerId = order.customerId?._id
      ? String(order.customerId._id)
      : String(order.customerId || "");
    const ownerId = order.ownerId?._id
      ? String(order.ownerId._id)
      : String(order.ownerId || "");
    const assignedAgentId = order.assignedAgent?._id
      ? String(order.assignedAgent._id)
      : String(order.assignedAgent || "");

    const isCustomer = Boolean(customerId && customerId === userId);
    const isOwner = Boolean(ownerId && ownerId === userId);
    const isAssignedAgent = Boolean(assignedAgentId && assignedAgentId === userId);

    if (!isCustomer && !isOwner && !isAssignedAgent) {
      return res.status(404).json({ message: "Order not found" });
    }

    const tracking = await OrderTracking.findOne({
      order: order._id,
    }).populate("order");
    if (tracking) {
      return res.status(200).json(tracking);
    }

    // Dynamic steps generation
    const rawStatus = (order.status || "pending").toLowerCase();
    const isPlaced = true;
    const isAssigned =
      rawStatus === "assigned" ||
      rawStatus === "shipped" ||
      rawStatus === "delivered" ||
      rawStatus === "completed";
    const isShipped =
      rawStatus === "shipped" ||
      rawStatus === "delivered" ||
      rawStatus === "completed";
    const isDelivered =
      rawStatus === "delivered" || rawStatus === "completed";

    const dynamicTracking = {
      _id: `track_${order._id}`,
      order: {
        _id: order._id,
        orderId: order.orderId,
        customerName:
          order.customerName ||
          order.customerId?.fullName ||
          "Customer",
        status: order.status,
        amount: order.totalPrice || order.amount || 0,
        createdAt: order.createdAt || new Date(),
      },
      steps: [
        {
          title: "Order Placed",
          description: "Your order has been received and confirmed.",
          timestamp: order.createdAt || new Date(),
          completed: isPlaced,
          current: rawStatus === "pending" && !order.assignedAgent,
        },
        {
          title: "Courier Assigned",
          description: order.assignedAgent
            ? "Assigned to delivery courier"
            : "Awaiting courier assignment",
          timestamp: order.claimedAt || null,
          completed: isAssigned,
          current: rawStatus === "assigned",
        },
        {
          title: "Out for Delivery",
          description: "Package is on the way to destination.",
          timestamp: order.shippedAt || null,
          completed: isShipped,
          current: rawStatus === "shipped",
        },
        {
          title: "Delivered",
          description: "Package received and OTP verified.",
          timestamp: order.deliveredAt || null,
          completed: isDelivered,
          current: isDelivered,
        },
      ],
    };

    res.status(200).json(dynamicTracking);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tracking record",
      error: error.message,
    });
  }
};

exports.createTracking = async (req, res) => {
  try {
    const { order, steps } = req.body;
    const newTracking = new OrderTracking({ order, steps });
    const savedTracking = await newTracking.save();
    res.status(201).json(savedTracking);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create tracking record",
      error: error.message,
    });
  }
};

exports.updateTracking = async (req, res) => {
  try {
    const updatedTracking = await OrderTracking.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedTracking) {
      return res.status(404).json({ message: "Tracking record not found" });
    }

    res.status(200).json(updatedTracking);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update tracking record",
      error: error.message,
    });
  }
};

exports.deleteTracking = async (req, res) => {
  try {
    const deletedTracking = await OrderTracking.findByIdAndDelete(
      req.params.id,
    );
    if (!deletedTracking) {
      return res.status(404).json({ message: "Tracking record not found" });
    }
    res.status(200).json({ message: "Tracking record deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete tracking record",
      error: error.message,
    });
  }
};
