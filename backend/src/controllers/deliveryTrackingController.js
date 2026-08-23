const mongoose = require("mongoose");
const Order = require("../models/Order");
const CustomerOrder = require("../models/CustomerOrder");
const DeliveryTracking = require("../models/DeliveryTracking");
const User = require("../models/User");
const LocationUpdate = require("../models/LocationUpdate");

const resolveOrder = async (orderIdParam) => {
  if (!orderIdParam) return null;

  // 1. Try Order by ObjectId
  if (mongoose.Types.ObjectId.isValid(orderIdParam)) {
    const order = await Order.findById(orderIdParam)
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email phone phoneNumber role")
      .populate("ownerId", "fullName businessName warehouseAddress businessAddress phone");
    if (order) return { order, model: "Order" };
  }

  // 2. Try Order by orderId string (e.g. "ORD-12345678" or suffix)
  let order = await Order.findOne({ orderId: orderIdParam })
    .populate("customerId", "fullName email phone phoneNumber")
    .populate("assignedAgent", "fullName email phone phoneNumber role")
    .populate("ownerId", "fullName businessName warehouseAddress businessAddress phone");
  if (order) return { order, model: "Order" };

  // 3. Try Order by regex on orderId
  order = await Order.findOne({
    orderId: { $regex: new RegExp(orderIdParam.replace("#", ""), "i") },
  })
    .populate("customerId", "fullName email phone phoneNumber")
    .populate("assignedAgent", "fullName email phone phoneNumber role")
    .populate("ownerId", "fullName businessName warehouseAddress businessAddress phone");
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

    // UNCLAIMED ORDER: Customer sees standby state without fake map or fake route
    if (!order.assignedAgent || order.status === "pending" || order.deliveryStage === "UNCLAIMED") {
      return res.status(200).json({
        isClaimed: false,
        status: "pending",
        deliveryStage: "UNCLAIMED",
        message: "Waiting for a delivery agent to claim your order.",
        order: {
          _id: order._id,
          orderId: order.orderId,
          customerName:
            order.customerName ||
            order.customerId?.fullName ||
            "Valued Customer",
          status: "pending",
          deliveryStage: "UNCLAIMED",
          totalPrice: order.totalPrice || order.amount || 0,
          createdAt: order.createdAt || new Date(),
          deliveryAddress: order.deliveryAddress,
        },
        origin: null,
        destination: null,
        currentPosition: null,
        waypoints: [],
      });
    }

    // CLAIMED ORDER: Build authoritative Two-Stage Delivery representation
    // 1. Warehouse / Pickup Destination
    let originLat =
      Number(order.pickupAddress?.latitude) ||
      Number(order.ownerId?.warehouseAddress?.latitude) ||
      13.0827;
    let originLng =
      Number(order.pickupAddress?.longitude) ||
      Number(order.ownerId?.warehouseAddress?.longitude) ||
      80.2707;
    let originName =
      order.pickupAddress?.fullName ||
      order.ownerId?.warehouseAddress?.businessName ||
      order.ownerId?.businessName ||
      "Merchant Warehouse";
    let originAddress =
      order.pickupAddress?.fullAddress ||
      order.ownerId?.warehouseAddress?.fullAddress ||
      order.ownerId?.businessAddress ||
      "Warehouse Location";

    // 2. Customer Delivery Destination
    let destLat =
      Number(order.deliveryAddress?.latitude) ||
      Number(order.shippingAddress?.latitude) ||
      13.0569;
    let destLng =
      Number(order.deliveryAddress?.longitude) ||
      Number(order.shippingAddress?.longitude) ||
      80.2425;
    let destName =
      order.deliveryAddress?.fullName ||
      order.customerName ||
      order.customerId?.fullName ||
      "Customer Destination";
    let destAddress =
      order.deliveryAddress?.fullAddress ||
      order.deliveryAddress?.street ||
      order.shippingAddress?.street ||
      "Customer Address";

    // 3. Agent Current Location
    let agentLat = originLat;
    let agentLng = originLng;
    let agentUpdatedAt = order.updatedAt;

    if (
      order.agentLocation &&
      order.agentLocation.latitude != null &&
      order.agentLocation.longitude != null &&
      !isNaN(Number(order.agentLocation.latitude)) &&
      !isNaN(Number(order.agentLocation.longitude))
    ) {
      agentLat = Number(order.agentLocation.latitude);
      agentLng = Number(order.agentLocation.longitude);
      agentUpdatedAt = order.agentLocation.updatedAt || order.updatedAt;
    } else {
      // Look up latest LocationUpdate
      const latestUpdate = await LocationUpdate.findOne({
        deliveryId: order._id.toString(),
      }).sort({ timestamp: -1 });

      if (latestUpdate && latestUpdate.latitude && latestUpdate.longitude) {
        agentLat = Number(latestUpdate.latitude);
        agentLng = Number(latestUpdate.longitude);
        agentUpdatedAt = latestUpdate.createdAt;
      }
    }

    if (
      order.deliveryStage === "AT_WAREHOUSE" ||
      order.deliveryStage === "TO_CUSTOMER"
    ) {
      agentLat = originLat;
      agentLng = originLng;
    } else if (
      order.deliveryStage === "AT_CUSTOMER" ||
      order.deliveryStage === "OTP_REQUESTED" ||
      order.deliveryStage === "DELIVERED" ||
      order.status === "delivered" ||
      order.status === "completed"
    ) {
      agentLat = destLat;
      agentLng = destLng;
    }

    const agentData = order.assignedAgent
      ? {
          _id: order.assignedAgent._id || order.assignedAgent.id,
          name:
            order.assignedAgent.fullName ||
            order.assignedAgent.name ||
            "Delivery Partner",
          phone:
            order.assignedAgent.phone ||
            order.assignedAgent.phoneNumber ||
            null,
          email: order.assignedAgent.email || null,
        }
      : null;

    const responsePayload = {
      isClaimed: true,
      _id: `deliv_${order._id}`,
      status: order.status,
      deliveryStage:
        order.deliveryStage ||
        (order.status === "delivered" || order.status === "completed"
          ? "DELIVERED"
          : order.status === "out-for-delivery"
            ? "AT_CUSTOMER"
            : order.status === "shipped"
              ? "TO_CUSTOMER"
              : "TO_WAREHOUSE"),
      customerVerified: Boolean(order.customerVerified),
      hasActiveOtp: Boolean(
        order.deliveryOtp?.expiresAt &&
          new Date(order.deliveryOtp.expiresAt).getTime() > Date.now()
      ),
      agent: agentData,
      agentLocation: {
        latitude: agentLat,
        longitude: agentLng,
        updatedAt: agentUpdatedAt,
      },
      origin: {
        name: originName,
        fullAddress: originAddress,
        lat: originLat,
        lng: originLng,
      },
      destination: {
        name: destName,
        fullAddress: destAddress,
        lat: destLat,
        lng: destLng,
      },
      currentPosition: {
        name: "Delivery Partner",
        lat: agentLat,
        lng: agentLng,
        updatedAt: agentUpdatedAt,
      },
      order: {
        _id: order._id,
        orderId: order.orderId,
        customerName:
          order.customerName ||
          order.customerId?.fullName ||
          "Valued Customer",
        status: order.status,
        deliveryStage: order.deliveryStage || "TO_WAREHOUSE",
        totalPrice: order.totalPrice || order.amount || 0,
        createdAt: order.createdAt || new Date(),
        shippedAt: order.shippedAt || null,
        deliveredAt: order.deliveredAt || null,
        pickupAddress: order.pickupAddress,
        deliveryAddress: order.deliveryAddress,
      },
      estimatedDelivery:
        order.status === "delivered"
          ? "Delivered"
          : order.deliveryStage === "TO_WAREHOUSE"
            ? "15-20 mins to pickup"
            : "20-30 mins to delivery",
      waypoints: [
        { lat: agentLat, lng: agentLng, name: "Agent Location" },
        { lat: originLat, lng: originLng, name: "Warehouse" },
        { lat: destLat, lng: destLng, name: "Customer Destination" },
      ],
    };

    res.status(200).json(responsePayload);
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
