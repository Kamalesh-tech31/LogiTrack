const mongoose = require("mongoose");
const OrderTracking = require("../models/OrderTracking");
const CustomerOrder = require("../models/CustomerOrder");
const Order = require("../models/Order");

const resolveOrder = async (orderIdParam) => {
  if (!orderIdParam) return null;

  // 1. Try Order by ObjectId
  if (mongoose.Types.ObjectId.isValid(orderIdParam)) {
    const order = await Order.findById(orderIdParam).populate(
      "customerId",
      "fullName email phone",
    );
    if (order) return { order, model: "Order" };
  }

  // 2. Try Order by orderId string
  let order = await Order.findOne({ orderId: orderIdParam }).populate(
    "customerId",
    "fullName email phone",
  );
  if (order) return { order, model: "Order" };

  // 3. Try Order by regex on orderId
  order = await Order.findOne({
    orderId: { $regex: new RegExp(orderIdParam.replace("#", ""), "i") },
  }).populate("customerId", "fullName email phone");
  if (order) return { order, model: "Order" };

  // 4. Try legacy CustomerOrder
  if (mongoose.Types.ObjectId.isValid(orderIdParam)) {
    const legacy = await CustomerOrder.findById(orderIdParam);
    if (legacy) return { order: legacy, model: "CustomerOrder" };
  }
  const legacy = await CustomerOrder.findOne({ orderId: orderIdParam });
  if (legacy) return { order: legacy, model: "CustomerOrder" };

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
