const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Order = require("../models/Order");
const User = require("../models/User");
const LocationUpdate = require("../models/LocationUpdate");
require("../models/product");
require("../models/CustomerProduct");
const {
  getDistanceFromLatLonInKm,
  computeRouteSequence,
  computeRouteSequenceRoad,
} = require("../utils/geo");
const deliveryOtpService = require("../services/deliveryOtpService");
const { isDeliveryAgent } = deliveryOtpService;
const {
  createOrderEventNotifications,
  createNotificationForRecipients,
} = require("../services/notificationService");

const BATCH_CAP = 10;
const PROXIMITY_RADIUS_KM = 5;

function formatDuration(ms) {
  if (ms <= 0) return "0m";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return remaining === 0 ? `${hours}h` : `${hours}h ${remaining}m`;
}

function formatAverageDuration(ms) {
  if (!ms || ms <= 0) return "--";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return remaining === 0 ? `${hours}h` : `${hours}h ${remaining}m`;
}

function getEtaForOrder(o) {
  const activeStatuses = ["assigned", "shipped", "out-for-delivery"];
  const completedStatuses = ["completed", "delivered"];
  const bufferMs = 20 * 60 * 1000;

  const shippedAt = o.shippedAt ? new Date(o.shippedAt).getTime() : null;
  const deliveredAt = o.deliveredAt ? new Date(o.deliveredAt).getTime() : null;

  if (completedStatuses.includes(o.status) && shippedAt && deliveredAt) {
    return formatDuration(deliveredAt - shippedAt + bufferMs);
  }

  if (activeStatuses.includes(o.status) && shippedAt) {
    const now = Date.now();
    return formatDuration(now - shippedAt + bufferMs);
  }

  if (activeStatuses.includes(o.status)) {
    return "20m";
  }

  return "--";
}

function getEtaMsForOrder(o) {
  const bufferMs = 20 * 60 * 1000;
  const shippedAt = o.shippedAt ? new Date(o.shippedAt).getTime() : null;
  const deliveredAt = o.deliveredAt ? new Date(o.deliveredAt).getTime() : null;

  if (deliveredAt && shippedAt) {
    return Math.max(0, deliveredAt - shippedAt) + bufferMs;
  }

  if (shippedAt) {
    return Math.max(0, Date.now() - shippedAt) + bufferMs;
  }

  return bufferMs;
}

function mapOrderToRecord(o, requester = null) {
  const addr = o.deliveryAddress || {};
  const isCustomerVerified = Boolean(o.customerVerified);

  let rawPhone =
    o.customerId?.phone || o.customerId?.phoneNumber || o.customerPhone || "";
  let contact = rawPhone || null;

  let addressStr =
    addr.fullAddress ||
    [
      addr.street,
      addr.city,
      addr.state,
      addr.postalCode,
      addr.country,
    ]
      .filter(Boolean)
      .join(", ");

  if (!addressStr) {
    addressStr = addr.city || "Destination Area";
  }

  let agent = null;
  if (o.assignedAgent) {
    if (typeof o.assignedAgent === "object") {
      agent = {
        _id: o.assignedAgent._id || o.assignedAgent.id,
        name:
          o.assignedAgent.fullName ||
          o.assignedAgent.name ||
          o.assignedAgent.email ||
          String(o.assignedAgent._id || o.assignedAgent.id),
        email: o.assignedAgent.email || null,
      };
    } else {
      agent = { _id: String(o.assignedAgent), name: String(o.assignedAgent) };
    }
  }

  const rawObj = o.toObject ? o.toObject() : { ...o };
  // Remove sensitive OTP hashes from raw payload
  if (rawObj.deliveryOtp) {
    rawObj.deliveryOtp = {
      expiresAt: rawObj.deliveryOtp.expiresAt,
      attempts: rawObj.deliveryOtp.attempts,
    };
  }
  delete rawObj.completionOtpHash;

  const deliveryStage =
    o.deliveryStage ||
    (o.status === "delivered" || o.status === "completed"
      ? "DELIVERED"
      : o.status === "out-for-delivery"
        ? "AT_CUSTOMER"
        : o.status === "shipped"
          ? "TO_CUSTOMER"
          : o.assignedAgent || o.claimedBy
            ? "TO_WAREHOUSE"
            : "UNCLAIMED");
  const currentUserId = requester
    ? String(requester._id || requester.id || "")
    : null;
  const assignedAgentId = o.assignedAgent
    ? typeof o.assignedAgent === "object"
      ? String(o.assignedAgent._id || o.assignedAgent.id || "")
      : String(o.assignedAgent)
    : o.claimedBy
      ? typeof o.claimedBy === "object"
        ? String(o.claimedBy._id || o.claimedBy.id || "")
        : String(o.claimedBy)
      : null;

  const isMyDelivery = Boolean(
    currentUserId && assignedAgentId && currentUserId === assignedAgentId,
  );
  const isClaimable = Boolean(
    !o.assignedAgent &&
      !o.claimedBy &&
      !["completed", "delivered", "failed", "returned", "cancelled"].includes(
        o.status,
      ),
  );

  return {
    id: o._id.toString(),
    orderId: o.orderId,
    customer:
      o.customerName ||
      (o.customerId?.fullName ? o.customerId.fullName : "Customer"),
    city: addr.city || null,
    address: addressStr,
    latitude: addr.latitude || null,
    longitude: addr.longitude || null,
    pickupAddress: o.pickupAddress || null,
    deliveryAddress: o.deliveryAddress || null,
    pickupLatitude: o.pickupAddress?.latitude || null,
    pickupLongitude: o.pickupAddress?.longitude || null,
    pickupName: o.pickupAddress?.fullName || o.pickupAddress?.fullAddress || "Merchant Warehouse",
    eta: getEtaForOrder(o),
    status: o.status,
    deliveryStage,
    isClaimed: Boolean(o.assignedAgent || o.claimedBy),
    isMyDelivery,
    isClaimable,
    agentLocation: o.agentLocation || null,
    priority: o.priority || null,
    contact,
    agent,
    customerVerified: isCustomerVerified,
    verifiedAt: o.verifiedAt || null,
    claimedAt: o.claimedAt || null,
    batchId: o.batchId || null,
    sequenceOrder: o.sequenceOrder || null,
    hasActiveOtp: Boolean(
      o.deliveryOtp?.expiresAt &&
        new Date(o.deliveryOtp.expiresAt).getTime() > Date.now(),
    ),
    otpExpiresAt: o.deliveryOtp?.expiresAt || null,
    location: null,
    lastUpdated: o.updatedAt ? o.updatedAt.toISOString() : null,
    raw: rawObj,
  };
}

// GET /api/deliveries
// Supports query params: owner=true, mine=true, status=...
const getAllDeliveries = async (req, res, next) => {
  try {
    const user = req.user;
    const { owner, mine, status } = req.query;

    const filter = {};
    const terminalStatuses = [
      "completed",
      "delivered",
      "failed",
      "returned",
      "cancelled",
    ];
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $nin: terminalStatuses };
    }

    if (owner === "true") {
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const userId = user._id || user.id;
      filter.ownerId = userId;
    } else if (user && isDeliveryAgent(user)) {
      const userId = user._id || user.id;
      filter.$or = [
        { assignedAgent: userId },
        { assignedAgent: { $exists: false } },
        { assignedAgent: null },
      ];
    } else if (mine === "true") {
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const userId = user._id || user.id;
      filter.$or = [
        { assignedAgent: userId },
        { assignedAgent: { $exists: false } },
        { assignedAgent: null },
      ];
    }

    const orders = await Order.find(filter)
      .populate("items.product", "name price images")
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .sort({ sequenceOrder: 1, createdAt: 1 });

    const mapped = orders.map((o) => mapOrderToRecord(o, user));
    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (err) {
    next(err);
  }
};

// GET /api/deliveries/agent/:agentId/availability
const checkAgentAvailability = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== "Delivery Agent") {
      return res.status(404).json({ message: "Agent not found" });
    }

    const terminalStatuses = [
      "completed",
      "delivered",
      "failed",
      "returned",
      "cancelled",
    ];

    const activeOrders = await Order.find({
      assignedAgent: agentId,
      status: { $nin: terminalStatuses },
    })
      .populate("items.product", "name price images")
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role");

    res.json({
      success: true,
      data: {
        agentStatus: agent.agentStatus || "available",
        activeBatchSize: activeOrders.length,
        batchCap: BATCH_CAP,
        activeOrders: activeOrders.map((o) => mapOrderToRecord(o, req.user)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/orders/:orderId/claim (delivery agent claims an unassigned order with GPS)
const claimOrder = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!isDeliveryAgent(user)) {
      return res
        .status(403)
        .json({ message: "Only delivery agents can claim orders" });
    }

    const { orderId } = req.params;
    const { latitude, longitude, accuracy } = req.body || {};
    const userId = user._id || user.id;

    // Strict GPS validation: Delivery agent MUST provide valid numerical coordinates during claim
    if (
      latitude == null ||
      longitude == null ||
      isNaN(Number(latitude)) ||
      isNaN(Number(longitude))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current device GPS location is required to claim this delivery. Please enable location permissions.",
      });
    }

    let cleanOrderId = String(orderId || "").replace(/^deliv_/, "").trim();
    let order = null;
    if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
      order = await Order.findById(cleanOrderId);
    }
    if (!order) {
      order = await Order.findOne({ orderId: cleanOrderId });
    }
    if (!order) return res.status(404).json({ message: "Order not found" });

    const terminalStatuses = [
      "completed",
      "delivered",
      "failed",
      "returned",
      "cancelled",
    ];

    if (terminalStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Cannot claim an order in '${order.status}' status`,
      });
    }

    if (order.assignedAgent && String(order.assignedAgent) !== String(userId)) {
      return res.status(409).json({
        message: "Order has already been claimed or assigned to another agent",
      });
    }

    const activeAssignedOrders = await Order.find({
      assignedAgent: userId,
      status: { $in: ["assigned", "shipped", "out-for-delivery"] },
      _id: { $ne: order._id },
    });

    if (activeAssignedOrders.length >= BATCH_CAP) {
      return res.status(403).json({
        message: `Batch cap of ${BATCH_CAP} reached. Complete your current active deliveries first.`,
      });
    }

    // Atomic claim to avoid race conditions
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        $or: [{ assignedAgent: null }, { assignedAgent: userId }],
        status: { $nin: terminalStatuses },
      },
      {
        $set: {
          assignedAgent: userId,
          claimedBy: userId,
          claimedAt: new Date(),
          status: "assigned",
          deliveryStage: "TO_WAREHOUSE",
          agentLocation: {
            latitude: Number(latitude),
            longitude: Number(longitude),
            accuracy: Number(accuracy) || null,
            updatedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(409).json({
        success: false,
        message: "Order is no longer available or was claimed by another driver.",
      });
    }

    // Persist initial location record
    await LocationUpdate.create({
      deliveryId: updatedOrder._id.toString(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      source: "agent-claim-gps",
      displayName: "Agent Start Location",
      formattedAddress: `Agent GPS: ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
      timestamp: new Date().toLocaleString(),
    });

    await User.findByIdAndUpdate(userId, { agentStatus: "on-delivery" });
    await createOrderEventNotifications(updatedOrder, "claimed");

    const populated = await Order.findById(updatedOrder._id)
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email phone phoneNumber role")
      .populate("items.product", "name");

    res.json({
      success: true,
      data: mapOrderToRecord(populated, user),
      message: "Order claimed successfully! Live tracking is now active.",
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/orders/:orderId/reached-warehouse
const reachedWarehouse = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || !isDeliveryAgent(user)) {
      return res.status(403).json({
        success: false,
        message: "Only assigned delivery agents can update delivery stage",
      });
    }
    const { orderId } = req.params;
    const userId = user._id || user.id;

    let cleanOrderId = String(orderId || "").replace(/^deliv_/, "").trim();
    let order = null;
    const agentFilter = { $or: [{ assignedAgent: userId }, { claimedBy: userId }] };
    if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
      order = await Order.findOne({ _id: cleanOrderId, ...agentFilter });
    }
    if (!order) {
      order = await Order.findOne({ orderId: cleanOrderId, ...agentFilter });
    }
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Assigned order not found" });
    }

    // Idempotent check: if already moved to TO_CUSTOMER or beyond, return current state
    if (
      order.deliveryStage === "TO_CUSTOMER" ||
      order.deliveryStage === "AT_CUSTOMER" ||
      order.deliveryStage === "OTP_REQUESTED" ||
      order.deliveryStage === "DELIVERED"
    ) {
      const populated = await Order.findById(order._id)
        .populate("customerId", "fullName email phone phoneNumber")
        .populate("assignedAgent", "fullName email role")
        .populate("items.product", "name");
      return res.json({
        success: true,
        data: mapOrderToRecord(populated, user),
        message: "Pickup arrival already confirmed.",
      });
    }

    order.deliveryStage = "TO_CUSTOMER";
    order.status = "shipped";
    if (!order.shippedAt) order.shippedAt = new Date();

    // Snap simulated agent position to warehouse so the map marker moves
    const warehouseLat =
      Number(order.pickupAddress?.latitude) || null;
    const warehouseLng =
      Number(order.pickupAddress?.longitude) || null;
    if (warehouseLat != null && warehouseLng != null && !isNaN(warehouseLat) && !isNaN(warehouseLng)) {
      order.agentLocation = {
        latitude: warehouseLat,
        longitude: warehouseLng,
        accuracy: null,
        updatedAt: new Date(),
      };
    }

    await order.save();

    // If part of a bulk batch, picking up at warehouse completes pickup for ALL orders in this batch
    if (order.batchId) {
      const terminalStatuses = [
        "completed",
        "delivered",
        "failed",
        "returned",
        "cancelled",
      ];
      await Order.updateMany(
        {
          batchId: order.batchId,
          assignedAgent: userId,
          status: { $nin: terminalStatuses },
          deliveryStage: { $in: ["UNCLAIMED", "TO_WAREHOUSE"] },
        },
        {
          $set: {
            deliveryStage: "TO_CUSTOMER",
            status: "shipped",
            shippedAt: new Date(),
            ...(warehouseLat != null && warehouseLng != null && !isNaN(warehouseLat) && !isNaN(warehouseLng)
              ? {
                  agentLocation: {
                    latitude: warehouseLat,
                    longitude: warehouseLng,
                    accuracy: null,
                    updatedAt: new Date(),
                  },
                }
              : {}),
          },
        },
      );
    }

    await createOrderEventNotifications(order, "pickup-reached");

    const populated = await Order.findById(order._id)
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name");

    res.json({
      success: true,
      data: mapOrderToRecord(populated, user),
      message: "Confirmed pickup arrival. Now heading to customer location.",
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/orders/:orderId/reached-customer
const reachedCustomer = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || !isDeliveryAgent(user)) {
      return res.status(403).json({
        success: false,
        message: "Only assigned delivery agents can update delivery stage",
      });
    }
    const { orderId } = req.params;
    const userId = user._id || user.id;

    let cleanOrderId = String(orderId || "").replace(/^deliv_/, "").trim();
    let order = null;
    const agentFilter = { $or: [{ assignedAgent: userId }, { claimedBy: userId }] };
    if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
      order = await Order.findOne({ _id: cleanOrderId, ...agentFilter });
    }
    if (!order) {
      order = await Order.findOne({ orderId: cleanOrderId, ...agentFilter });
    }
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Assigned order not found" });
    }

    // Idempotent check: if already reached customer or beyond, return current state
    if (
      order.deliveryStage === "AT_CUSTOMER" ||
      order.deliveryStage === "OTP_REQUESTED" ||
      order.deliveryStage === "DELIVERED"
    ) {
      const populated = await Order.findById(order._id)
        .populate("customerId", "fullName email phone phoneNumber")
        .populate("assignedAgent", "fullName email role")
        .populate("items.product", "name");
      return res.json({
        success: true,
        data: mapOrderToRecord(populated, user),
        message: "Arrival at customer location already confirmed.",
      });
    }

    order.deliveryStage = "AT_CUSTOMER";
    order.status = "out-for-delivery";

    // Snap simulated agent position to customer location so the map marker moves
    const customerLat = Number(order.deliveryAddress?.latitude) || null;
    const customerLng = Number(order.deliveryAddress?.longitude) || null;
    if (customerLat != null && customerLng != null && !isNaN(customerLat) && !isNaN(customerLng)) {
      order.agentLocation = {
        latitude: customerLat,
        longitude: customerLng,
        accuracy: null,
        updatedAt: new Date(),
      };
    }

    await order.save();

    await createOrderEventNotifications(order, "customer-reached");

    const populated = await Order.findById(order._id)
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name");

    res.json({
      success: true,
      data: mapOrderToRecord(populated, user),
      message:
        "Arrived at customer location. You can now request the delivery handoff OTP.",
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/orders/:orderId/telemetry
const updateAgentTelemetry = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || !isDeliveryAgent(user)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const { orderId } = req.params;
    const { latitude, longitude, accuracy, speed, heading, addressName } =
      req.body || {};
    const userId = user._id || user.id;

    if (
      latitude == null ||
      longitude == null ||
      isNaN(Number(latitude)) ||
      isNaN(Number(longitude))
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Valid coordinates required" });
    }

    const order = await Order.findOne({ _id: orderId, assignedAgent: userId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Active assigned order not found" });
    }

    order.agentLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: Number(accuracy) || null,
      speed: Number(speed) || null,
      heading: Number(heading) || null,
      updatedAt: new Date(),
    };
    await order.save();

    await LocationUpdate.create({
      deliveryId: order._id.toString(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      source: "agent-live-gps",
      displayName: addressName || "Driver Live GPS",
      formattedAddress:
        addressName ||
        `Lat: ${Number(latitude).toFixed(4)}, Lng: ${Number(longitude).toFixed(4)}`,
      timestamp: new Date().toLocaleString(),
    });

    res.json({ success: true, message: "Location updated successfully" });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/orders/:orderId/assign (owner assigns an agent)
const assignOrder = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { orderId } = req.params;
    const { agentId } = req.body;

    if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ message: "Valid agentId required" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const userId = user._id || user.id;
    if (String(order.ownerId) !== String(userId) && user.role !== "Owner") {
      return res
        .status(403)
        .json({ message: "Not authorized to assign this order" });
    }

    const agent = await User.findById(agentId);
    if (!agent || agent.role !== "Delivery Agent") {
      return res
        .status(400)
        .json({ message: "Agent not found or invalid role" });
    }

    order.assignedAgent = agent._id;
    order.status = "assigned";
    await order.save();
    await createOrderEventNotifications(order, "assigned");

    const populated = await Order.findById(order._id)
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name");
    res.json({ success: true, data: mapOrderToRecord(populated, user) });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/orders/:orderId/accept (agent accepts assigned order -> Shipped)
const acceptOrder = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!isDeliveryAgent(user)) {
      return res
        .status(403)
        .json({ message: "Only delivery agents can accept orders" });
    }

    const { orderId } = req.params;
    const userId = user._id || user.id;

    let cleanOrderId = String(orderId || "").replace(/^deliv_/, "").trim();
    let order = null;
    if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
      order = await Order.findById(cleanOrderId);
    }
    if (!order) {
      order = await Order.findOne({ orderId: cleanOrderId });
    }
    if (!order) return res.status(404).json({ message: "Order not found" });

    const terminalStatuses = [
      "completed",
      "delivered",
      "failed",
      "returned",
      "cancelled",
    ];

    const activeOrders = await Order.find({
      assignedAgent: userId,
      status: { $nin: terminalStatuses },
      _id: { $ne: order._id },
    });

    if (activeOrders.length >= BATCH_CAP) {
      return res.status(403).json({
        message: `Batch cap of ${BATCH_CAP} reached. Complete your current active deliveries first.`,
      });
    }

    if (activeOrders.length > 0) {
      const newOrderAddr = order.deliveryAddress;
      if (!newOrderAddr || !newOrderAddr.latitude || !newOrderAddr.longitude) {
        return res.status(403).json({
          message: "New order has no valid coordinates. Complete current delivery first.",
        });
      }

      let isNearby = false;
      const latestLocation = await LocationUpdate.findOne({
        deliveryId: { $in: activeOrders.map((o) => o._id.toString()) },
      }).sort({ timestamp: -1 });

      if (latestLocation) {
        const dist = getDistanceFromLatLonInKm(
          newOrderAddr.latitude,
          newOrderAddr.longitude,
          latestLocation.latitude,
          latestLocation.longitude,
        );
        if (dist <= PROXIMITY_RADIUS_KM) isNearby = true;
      }

      if (!isNearby) {
        for (const activeOrder of activeOrders) {
          const addr = activeOrder.deliveryAddress;
          if (addr && addr.latitude && addr.longitude) {
            const dist = getDistanceFromLatLonInKm(
              newOrderAddr.latitude,
              newOrderAddr.longitude,
              addr.latitude,
              addr.longitude,
            );
            if (dist <= PROXIMITY_RADIUS_KM) {
              isNearby = true;
              break;
            }
          }
        }
      }

      if (isNearby) {
        return res.status(202).json({
          success: true,
          batchable: true,
          message: `Order #${order.orderId || order._id} is nearby your active route! Would you like to add it to your batch?`,
        });
      } else {
        return res.status(403).json({
          message: "Order is outside the nearby route proximity. Complete current delivery first.",
        });
      }
    }

    if (
      !order.assignedAgent ||
      String(order.assignedAgent._id || order.assignedAgent) !== String(userId)
    ) {
      order.assignedAgent = userId;
    }

    order.status = "shipped";
    order.shippedAt = new Date();
    await order.save();

    await User.findByIdAndUpdate(userId, { agentStatus: "on-delivery" });
    await createOrderEventNotifications(order, "shipped");

    const populated = await Order.findById(order._id)
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name");

    res.json({
      success: true,
      data: mapOrderToRecord(populated, user),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/orders/:orderId/add-to-batch
const addOrderToBatch = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || user.role !== "Delivery Agent") {
      return res
        .status(403)
        .json({ message: "Only delivery agents can batch orders" });
    }
    const userId = user._id || user.id;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.assignedAgent && String(order.assignedAgent) !== String(userId)) {
      return res.status(403).json({ message: "Order not assigned to you" });
    }

    const terminalStatuses = [
      "completed",
      "delivered",
      "failed",
      "returned",
      "cancelled",
    ];
    const activeOrders = await Order.find({
      assignedAgent: userId,
      status: { $nin: terminalStatuses },
      _id: { $ne: order._id },
    });

    if (activeOrders.length >= BATCH_CAP) {
      return res
        .status(403)
        .json({ message: `Batch cap of ${BATCH_CAP} reached.` });
    }

    const batchId =
      activeOrders.length > 0 && activeOrders[0].batchId
        ? activeOrders[0].batchId
        : new mongoose.Types.ObjectId().toString();

    order.assignedAgent = userId;
    order.status = "shipped";
    order.shippedAt = new Date();
    order.batchId = batchId;
    await order.save();

    activeOrders.push(order);

    await Order.updateMany(
      { _id: { $in: activeOrders.map((o) => o._id) } },
      { $set: { batchId } },
    );

    const latestLocation = await LocationUpdate.findOne({
      deliveryId: { $in: activeOrders.map((o) => o._id.toString()) },
    }).sort({ timestamp: -1 });

    let currentLoc = latestLocation
      ? { lat: latestLocation.latitude, lng: latestLocation.longitude }
      : null;

    if (!currentLoc && activeOrders[0]?.deliveryAddress?.latitude) {
      currentLoc = {
        lat: activeOrders[0].deliveryAddress.latitude,
        lng: activeOrders[0].deliveryAddress.longitude,
      };
    }

    const objectStops = activeOrders
      .filter((o) => o.deliveryAddress && o.deliveryAddress.latitude)
      .map((o) => ({
        id: o._id.toString(),
        lat: o.deliveryAddress.latitude,
        lng: o.deliveryAddress.longitude,
      }));

    if (currentLoc && objectStops.length > 0) {
      const sequence = await computeRouteSequenceRoad(currentLoc, objectStops);
      for (let i = 0; i < sequence.length; i++) {
        await Order.findByIdAndUpdate(sequence[i], { sequenceOrder: i + 1 });
      }
    }

    await User.findByIdAndUpdate(userId, { agentStatus: "on-delivery" });
    await createOrderEventNotifications(order, "shipped");

    res.json({ success: true, message: "Added to batch successfully!" });
  } catch (err) {
    next(err);
  }
};

// GET /api/deliveries/orders/:orderId/nearby
const getNearbyOrders = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || !isDeliveryAgent(user)) {
      return res
        .status(403)
        .json({ message: "Only delivery agents can query nearby orders" });
    }

    const { orderId } = req.params;
    let cleanOrderId = String(orderId || "").replace(/^deliv_/, "").trim();
    let refOrder = null;
    if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
      refOrder = await Order.findById(cleanOrderId);
    }
    if (!refOrder) {
      refOrder = await Order.findOne({ orderId: cleanOrderId });
    }
    if (!refOrder) {
      return res.status(404).json({ message: "Reference order not found" });
    }

    const refPickupLat = Number(refOrder.pickupAddress?.latitude);
    const refPickupLng = Number(refOrder.pickupAddress?.longitude);
    const refDropLat = Number(refOrder.deliveryAddress?.latitude);
    const refDropLng = Number(refOrder.deliveryAddress?.longitude);

    const terminalStatuses = [
      "completed",
      "delivered",
      "failed",
      "returned",
      "cancelled",
    ];
    const candidates = await Order.find({
      _id: { $ne: refOrder._id },
      assignedAgent: null,
      claimedBy: null,
      status: { $nin: terminalStatuses },
    })
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("items.product", "name price images");

    const matched = [];

    for (const cand of candidates) {
      const candPickupLat = Number(cand.pickupAddress?.latitude);
      const candPickupLng = Number(cand.pickupAddress?.longitude);
      const candDropLat = Number(cand.deliveryAddress?.latitude);
      const candDropLng = Number(cand.deliveryAddress?.longitude);

      if (isNaN(candDropLat) || isNaN(candDropLng)) continue;

      // Priority: check same warehouse / shop
      const isSameWarehouse = Boolean(
        (!isNaN(refPickupLat) &&
          !isNaN(candPickupLat) &&
          getDistanceFromLatLonInKm(
            refPickupLat,
            refPickupLng,
            candPickupLat,
            candPickupLng,
          ) <= 0.05) ||
          (refOrder.pickupAddress?.fullAddress &&
            cand.pickupAddress?.fullAddress &&
            refOrder.pickupAddress.fullAddress.trim().toLowerCase() ===
              cand.pickupAddress.fullAddress.trim().toLowerCase()),
      );

      // Proximity calculation: measure customer drop-off destination distance
      let dist = Infinity;
      if (
        !isNaN(refDropLat) &&
        !isNaN(refDropLng) &&
        !isNaN(candDropLat) &&
        !isNaN(candDropLng)
      ) {
        dist = getDistanceFromLatLonInKm(
          refDropLat,
          refDropLng,
          candDropLat,
          candDropLng,
        );
      } else if (!isNaN(refPickupLat) && !isNaN(candPickupLat)) {
        dist = getDistanceFromLatLonInKm(
          refPickupLat,
          refPickupLng,
          candPickupLat,
          candPickupLng,
        );
      }

      if (dist === Infinity) {
        dist = 0;
      }

      // Maximum nearby radius = 3 km
      if (dist <= 3.0) {
        matched.push({
          id: cand._id.toString(),
          orderId: cand.orderId,
          customer:
            cand.customerName ||
            cand.customerId?.fullName ||
            "Customer",
          shopName:
            cand.pickupAddress?.fullName ||
            cand.pickupAddress?.fullAddress ||
            "Merchant Warehouse",
          distanceKm: Number(dist.toFixed(1)),
          isSameWarehouse,
          pickupAddress: cand.pickupAddress,
          deliveryAddress: cand.deliveryAddress,
          totalPrice: cand.totalPrice,
          itemsCount: cand.items?.length || 1,
        });
      }
    }

    // Sort: sameWarehouse first, then closest distance
    matched.sort((a, b) => {
      if (a.isSameWarehouse && !b.isSameWarehouse) return -1;
      if (!a.isSameWarehouse && b.isSameWarehouse) return 1;
      return a.distanceKm - b.distanceKm;
    });

    const within1km = matched.filter((o) => o.distanceKm <= 1.0);
    const within2km = matched.filter(
      (o) => o.distanceKm > 1.0 && o.distanceKm <= 2.0,
    );
    const within3km = matched.filter(
      (o) => o.distanceKm > 2.0 && o.distanceKm <= 3.0,
    );

    res.json({
      success: true,
      data: {
        totalEligible: matched.length,
        within1km,
        within2km,
        within3km,
        allCandidates: matched,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/bulk-claim
const bulkClaimOrders = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || !isDeliveryAgent(user)) {
      return res
        .status(403)
        .json({ message: "Only delivery agents can claim bulk orders" });
    }
    const userId = user._id || user.id;
    const { orderIds, latitude, longitude, accuracy } = req.body || {};

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide orderIds to claim" });
    }

    if (
      latitude == null ||
      longitude == null ||
      isNaN(Number(latitude)) ||
      isNaN(Number(longitude))
    ) {
      return res.status(400).json({
        message:
          "Current device GPS location is required to claim bulk delivery.",
      });
    }

    const cleanIds = orderIds.map((id) =>
      String(id).replace(/^deliv_/, "").trim(),
    );
    const orders = await Order.find({
      $or: [
        {
          _id: {
            $in: cleanIds.filter((id) => mongoose.Types.ObjectId.isValid(id)),
          },
        },
        { orderId: { $in: cleanIds } },
      ],
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: "No matching orders found" });
    }

    const terminalStatuses = [
      "completed",
      "delivered",
      "failed",
      "returned",
      "cancelled",
    ];
    for (const o of orders) {
      if (terminalStatuses.includes(o.status)) {
        return res.status(400).json({
          message: `Order #${o.orderId || o._id} is already in ${o.status} status`,
        });
      }
      if (o.assignedAgent && String(o.assignedAgent) !== String(userId)) {
        return res.status(409).json({
          message: `Order #${o.orderId || o._id} is already assigned to another agent`,
        });
      }
    }

    const batchId = `BD-${Date.now().toString().slice(-6)}`;
    const agentStart = { lat: Number(latitude), lng: Number(longitude) };

    const stops = orders
      .filter(
        (o) =>
          o.deliveryAddress &&
          !isNaN(Number(o.deliveryAddress.latitude)),
      )
      .map((o) => ({
        id: o._id.toString(),
        lat: Number(o.deliveryAddress.latitude),
        lng: Number(o.deliveryAddress.longitude),
      }));

    const warehouseLoc =
      orders[0]?.pickupAddress?.latitude &&
      orders[0]?.pickupAddress?.longitude
        ? {
            lat: Number(orders[0].pickupAddress.latitude),
            lng: Number(orders[0].pickupAddress.longitude),
          }
        : agentStart;

    let sequence = stops.map((s) => s.id);
    if (stops.length > 1) {
      sequence = await computeRouteSequenceRoad(warehouseLoc, stops);
    }

    const now = new Date();
    for (let i = 0; i < orders.length; i++) {
      const ord = orders[i];
      const seqIndex = sequence.indexOf(ord._id.toString());
      const seqOrder = seqIndex !== -1 ? seqIndex + 1 : i + 1;

      ord.assignedAgent = userId;
      ord.claimedBy = userId;
      ord.claimedAt = now;
      ord.batchId = batchId;
      ord.sequenceOrder = seqOrder;
      ord.status = "assigned";
      ord.deliveryStage = "TO_WAREHOUSE";
      ord.agentLocation = {
        latitude: Number(latitude),
        longitude: Number(longitude),
        accuracy: Number(accuracy) || null,
        updatedAt: now,
      };
      await ord.save();

      await LocationUpdate.create({
        deliveryId: ord._id.toString(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        source: "agent-bulk-claim-gps",
        displayName: "Agent Bulk Start Location",
        formattedAddress: `Agent GPS: ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
        timestamp: now.toLocaleString(),
      });
    }

    await User.findByIdAndUpdate(userId, { agentStatus: "on-delivery" });

    const updatedOrders = await Order.find({ batchId })
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name")
      .sort({ sequenceOrder: 1 });

    res.json({
      success: true,
      batchId,
      count: updatedOrders.length,
      data: updatedOrders.map((o) => mapOrderToRecord(o, user)),
      message: `Bulk delivery created successfully with ${updatedOrders.length} orders!`,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/deliveries/:id/status - update status (owner or agent)
const updateDeliveryStatus = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status, otp, completionPhoto } = req.body;

    let cleanOrderId = String(id || "").replace(/^deliv_/, "").trim();
    let order = null;
    if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
      order = await Order.findById(cleanOrderId);
    }
    if (!order) {
      order = await Order.findOne({ orderId: cleanOrderId });
    }
    if (!order) return res.status(404).json({ message: "Order not found" });

    const userId = user ? user._id || user.id : null;

    if (
      order.assignedAgent &&
      userId &&
      String(order.assignedAgent) !== String(userId)
    ) {
      if (!user || user.role !== "Owner")
        return res
          .status(403)
          .json({ message: "Not authorized to update this order" });
    }

    const allowed = [
      "pending",
      "assigned",
      "shipped",
      "out-for-delivery",
      "completed",
      "delivered",
      "cancelled",
    ];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Gating for Final Handover / Delivery Completion via OTP
    if (status === "completed" || status === "delivered") {
      if (user && isDeliveryAgent(user)) {
        if (!order.customerVerified) {
          if (!otp) {
            return res.status(400).json({
              message:
                "Customer delivery OTP verification is required to complete delivery.",
            });
          }
          // Verify submitted OTP
          await deliveryOtpService.verifyDeliveryOtp(order._id, otp, user);
        }
      }

      if (completionPhoto) {
        order.completionPhoto = completionPhoto;
      }
      order.deliveredAt = new Date();
    }

    if (status) order.status = status;
    await order.save();

    if (status) {
      await createOrderEventNotifications(order, status);
    }

    if (
      order.assignedAgent &&
      ["completed", "delivered", "cancelled", "returned", "failed"].includes(
        status,
      )
    ) {
      const activeRemaining = await Order.countDocuments({
        assignedAgent: order.assignedAgent,
        status: {
          $nin: ["completed", "delivered", "failed", "returned", "cancelled"],
        },
      });
      if (activeRemaining === 0) {
        await User.findByIdAndUpdate(order.assignedAgent, {
          agentStatus: "available",
        });
      }
    }

    const populated = await Order.findById(order._id)
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name");
    res.json({ success: true, data: mapOrderToRecord(populated, user) });
  } catch (err) {
    if (err.statusCode) {
      return res
        .status(err.statusCode)
        .json({ success: false, message: err.message });
    }
    next(err);
  }
};

const getActiveDeliveries = async (req, res, next) => {
  try {
    const user = req.user;
    const agentId = user && (user._id || user.id);
    const filter = {
      status: { $in: ["assigned", "shipped", "out-for-delivery"] },
    };
    if (user && isDeliveryAgent(user) && agentId) {
      filter.assignedAgent = agentId;
    }
    const active = await Order.find(filter)
      .populate("items.product")
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role");
    const mapped = active.map((o) => mapOrderToRecord(o, user));
    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (err) {
    next(err);
  }
};

const getHistoryDeliveries = async (req, res, next) => {
  try {
    const user = req.user;
    const agentId = req.user?.id || req.user?._id;
    if (!agentId) return res.status(401).json({ message: "Unauthorized" });

    const filter = {
      status: { $in: ["completed", "delivered", "failed", "returned"] },
      $or: [{ assignedAgent: agentId }, { claimedBy: agentId }],
    };

    const history = await Order.find(filter)
      .populate("items.product")
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .sort({ deliveredAt: -1, updatedAt: -1 });

    const mapped = history.map((o) => mapOrderToRecord(o, user));

    let cumulative = 0;
    for (let i = 0; i < history.length; i++) {
      mapped[i].eta = formatDuration(cumulative);
      cumulative += getEtaMsForOrder(history[i]);
    }

    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (err) {
    next(err);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    const agentId = user && (user._id || user.id);
    const isAgent = user && isDeliveryAgent(user);

    const activeFilter = {
      status: { $in: ["assigned", "shipped", "out-for-delivery"] },
    };
    const completedFilter = { status: { $in: ["completed", "delivered"] } };
    const followUpFilter = { status: "failed" };

    if (isAgent && agentId) {
      activeFilter.$or = [{ assignedAgent: agentId }, { claimedBy: agentId }];
      completedFilter.$or = [{ assignedAgent: agentId }, { claimedBy: agentId }];
      followUpFilter.$or = [{ assignedAgent: agentId }, { claimedBy: agentId }];
    }

    const activeDeliveriesCount = await Order.countDocuments(activeFilter);
    const completedDeliveriesCount =
      await Order.countDocuments(completedFilter);
    const followUps = await Order.countDocuments(followUpFilter);

    const activeDeliveries = await Order.find(activeFilter)
      .populate("items.product")
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .limit(20)
      .sort({ updatedAt: -1 });

    const activeRoutes = activeDeliveries.map((o) =>
      mapOrderToRecord(o, user),
    );

    const completedForEtaFilter = { ...completedFilter };
    const completedOrdersForEta = await Order.find(completedForEtaFilter)
      .select("shippedAt deliveredAt createdAt")
      .limit(100)
      .sort({ deliveredAt: -1 });

    let totalMs = 0;
    let counted = 0;
    completedOrdersForEta.forEach((o) => {
      const shipped = o.shippedAt ? new Date(o.shippedAt).getTime() : null;
      const delivered = o.deliveredAt
        ? new Date(o.deliveredAt).getTime()
        : null;
      const created = o.createdAt ? new Date(o.createdAt).getTime() : null;
      let duration = null;
      if (shipped && delivered) duration = delivered - shipped;
      else if (delivered && created) duration = delivered - created;
      if (duration && duration > 0) {
        totalMs += duration;
        counted += 1;
      }
    });

    const avgEtaStr =
      counted > 0 ? formatAverageDuration(totalMs / counted) : "--";

    res.json({
      success: true,
      data: {
        activeDeliveries: activeDeliveriesCount,
        completedDeliveries: completedDeliveriesCount,
        followUps,
        avgEta: avgEtaStr,
        routeUpdates: activeRoutes.length,
        activeRoutes,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getEarnings = async (req, res, next) => {
  try {
    const agentId = req.user?._id || req.user?.id;
    if (!agentId) return res.status(401).json({ message: "Unauthorized" });
    const deliveries = await Order.find({
      $or: [{ assignedAgent: agentId }, { claimedBy: agentId }],
      status: { $in: ["completed", "delivered"] },
    }).select("totalPrice deliveredAt");

    let totalEarned = 0;
    deliveries.forEach((d) => {
      const price = Number(d.totalPrice || 0);
      totalEarned += price > 5000 ? 200 : 100;
    });

    const bonusStep = 1000;
    const bonusAmount = Math.floor(totalEarned / bonusStep) * 100;
    const totalWithBonus = totalEarned + bonusAmount;

    const response = {
      success: true,
      data: {
        earned: totalEarned,
        orders: deliveries.length,
        bonus: bonusAmount,
        totalWithBonus,
        highlights: [{ title: "Earned", value: `₹${totalWithBonus}` }],
        incentives: [],
        meta: {
          perOrderBase: 100,
          perOrderPremium: 200,
          premiumThreshold: 5000,
          bonusStep,
          bonusPerStep: 100,
          bonusAmount,
        },
      },
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};

const createDelivery = async (req, res, next) => {
  res.status(400).json({
    success: false,
    message:
      "Creating separate Delivery documents is deprecated. Use /api/orders to create orders and /api/deliveries/orders/:orderId/assign to assign agents.",
  });
};

const updateDelivery = async (req, res, next) => {
  res.status(400).json({
    success: false,
    message: "Use order endpoints to update deliveries/status.",
  });
};

const deleteDelivery = async (req, res, next) => {
  res.status(400).json({
    success: false,
    message: "Deleting delivery documents is not supported.",
  });
};

const getDeliveries = async (req, res, next) => {
  try {
    const user = req.user;
    const { orderId, agentId } = req.query;
    const filter = {};
    const terminalStatuses = [
      "completed",
      "delivered",
      "failed",
      "returned",
      "cancelled",
    ];
    filter.status = { $nin: terminalStatuses };
    if (orderId) filter._id = orderId;
    if (agentId) filter.assignedAgent = agentId;
    const orders = await Order.find(filter)
      .populate("items.product")
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName");
    const mapped = orders.map((o) => mapOrderToRecord(o, user));
    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (err) {
    next(err);
  }
};

const generateDeliveryOtp = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const user = req.user;
    const result = await deliveryOtpService.generateDeliveryOtp(orderId, user);
    res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res
        .status(err.statusCode)
        .json({ success: false, message: err.message });
    }
    next(err);
  }
};

const verifyCustomerOtp = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body;
    const user = req.user;

    if (!otp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP is required" });
    }

    const result = await deliveryOtpService.verifyDeliveryOtp(
      orderId,
      otp,
      user,
    );

    const order = await Order.findById(orderId);
    if (order) {
      await createOrderEventNotifications(order, "verified");
    }

    res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res
        .status(err.statusCode)
        .json({ success: false, message: err.message });
    }
    next(err);
  }
};

module.exports = {
  checkAgentAvailability,
  addOrderToBatch,
  getAllDeliveries,
  claimOrder,
  reachedWarehouse,
  reachedCustomer,
  updateAgentTelemetry,
  assignOrder,
  assignDelivery: assignOrder,
  acceptOrder,
  updateDeliveryStatus,
  getActiveDeliveries,
  getHistoryDeliveries,
  getDashboard,
  getEarnings,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  getDeliveries,
  generateDeliveryOtp,
  verifyCustomerOtp,
  mapOrderToRecord,
  getNearbyOrders,
  bulkClaimOrders,
};
