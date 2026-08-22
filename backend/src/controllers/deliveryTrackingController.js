const mongoose = require("mongoose");
const DeliveryTracking = require("../models/DeliveryTracking");
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

  // 2. Try Order by orderId string (e.g. "ORD-12345678" or suffix)
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

exports.getAllDeliveryTracks = async (req, res) => {
  try {
    const deliveries = await DeliveryTracking.find().populate("order");
    res.status(200).json(deliveries);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch delivery records",
      error: error.message,
    });
  }
};

exports.getDeliveryByOrderId = async (req, res) => {
  try {
    const resolved = await resolveOrder(req.params.orderId);
    if (!resolved) {
      return res.status(404).json({ message: "Order not found" });
    }

    const { order } = resolved;

    // Check if an explicit DeliveryTracking record exists
    const delivery = await DeliveryTracking.findOne({
      order: order._id,
    }).populate("order");

    if (delivery) {
      return res.status(200).json(delivery);
    }

    // Dynamic fallback generation from the Order document
    const destLat =
      Number(order.deliveryAddress?.latitude) ||
      Number(order.shippingAddress?.latitude) ||
      13.0569;
    const destLng =
      Number(order.deliveryAddress?.longitude) ||
      Number(order.shippingAddress?.longitude) ||
      80.2425;
    const destName =
      order.deliveryAddress?.fullAddress ||
      order.deliveryAddress?.street ||
      order.shippingAddress?.street ||
      "Customer Destination";

    const dynamicDelivery = {
      _id: `deliv_${order._id}`,
      order: {
        _id: order._id,
        orderId: order.orderId,
        customerName:
          order.customerName ||
          order.customerId?.fullName ||
          "Valued Customer",
        status: order.status || "pending",
        amount: order.totalPrice || order.amount || 0,
        createdAt: order.createdAt || new Date(),
        deliveryAddress: order.deliveryAddress,
      },
      origin: {
        name: "Central Logistics Hub",
        lat: 13.0827,
        lng: 80.2707,
      },
      destination: {
        name: destName,
        lat: destLat,
        lng: destLng,
      },
      currentPosition: {
        lat: order.status === "delivered" ? destLat : 13.0827,
        lng: order.status === "delivered" ? destLng : 80.2707,
      },
      status: order.status || "pending",
      estimatedDelivery: order.estimatedDelivery || "45 mins",
      waypoints: [],
    };

    res.status(200).json(dynamicDelivery);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch delivery record",
      error: error.message,
    });
  }
};

exports.createDeliveryTrack = async (req, res) => {
  try {
    const {
      order,
      origin,
      destination,
      currentPosition,
      waypoints,
      status,
      estimatedDelivery,
    } = req.body;
    const newDeliveryTrack = new DeliveryTracking({
      order,
      origin,
      destination,
      currentPosition,
      waypoints,
      status,
      estimatedDelivery,
    });
    const savedDeliveryTrack = await newDeliveryTrack.save();
    res.status(201).json(savedDeliveryTrack);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create delivery record",
      error: error.message,
    });
  }
};

exports.updateDeliveryTrack = async (req, res) => {
  try {
    const updatedDelivery = await DeliveryTracking.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedDelivery) {
      return res.status(404).json({ message: "Delivery record not found" });
    }

    res.status(200).json(updatedDelivery);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update delivery record",
      error: error.message,
    });
  }
};

exports.deleteDeliveryTrack = async (req, res) => {
  try {
    const deletedDelivery = await DeliveryTracking.findByIdAndDelete(
      req.params.id,
    );
    if (!deletedDelivery) {
      return res.status(404).json({ message: "Delivery record not found" });
    }
    res.status(200).json({ message: "Delivery record deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete delivery record",
      error: error.message,
    });
  }
};
