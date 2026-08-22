const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Order = require("../models/Order");
const User = require("../models/User");
const deliveryOtpService = require("../services/deliveryOtpService");
const {
  createOrderEventNotifications,
  createNotificationForRecipients,
} = require("../services/notificationService");

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

  const requesterId = requester ? String(requester._id || requester.id) : null;
  const requesterRole = requester?.role;

  const customerId = o.customerId?._id
    ? String(o.customerId._id)
    : String(o.customerId || "");
  const assignedAgentId = o.assignedAgent?._id
    ? String(o.assignedAgent._id)
    : String(o.assignedAgent || "");
  const ownerId = o.ownerId?._id
    ? String(o.ownerId._id)
    : String(o.ownerId || "");

  const isCustomer = customerId && customerId === requesterId;
  const isOwner =
    (ownerId && ownerId === requesterId) ||
    requesterRole === "Business Owner" ||
    requesterRole === "Owner";
  const isAssignedAgent = assignedAgentId && assignedAgentId === requesterId;

  // Masking policy:
  // Customers and Owners always see full address and phone.
  // Delivery agent sees full address and phone ONLY after customerVerified === true.
  // Before verification, agent sees masked address and masked phone.
  const canSeeFullData =
    isCustomer || isOwner || (isAssignedAgent && isCustomerVerified);

  let rawPhone =
    o.customerId?.phone || o.customerId?.phoneNumber || o.customerPhone || "";
  let contact = rawPhone || null;
  if (!canSeeFullData && rawPhone) {
    const cleanPhone = String(rawPhone);
    if (cleanPhone.length > 4) {
      contact = `••••• ••${cleanPhone.slice(-4)}`;
    } else {
      contact = "••••••••••";
    }
  }

  let addressStr = [
    addr.street,
    addr.city,
    addr.state,
    addr.postalCode,
    addr.country,
  ]
    .filter(Boolean)
    .join(", ");

  if (!canSeeFullData) {
    const safeCity = addr.city || "Destination Area";
    addressStr = `•••••••• (Verify OTP to view), ${safeCity}`;
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
    eta: getEtaForOrder(o),
    status: o.status,
    priority: o.priority || null,
    contact,
    agent,
    customerVerified: isCustomerVerified,
    verifiedAt: o.verifiedAt || null,
    claimedAt: o.claimedAt || null,
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
    }

    if (mine === "true") {
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
      .sort({ createdAt: -1 });

    const mapped = orders.map((o) => mapOrderToRecord(o, user));
    if (mine === "true") {
      let cumulative = 0;
      for (let i = 0; i < orders.length; i++) {
        mapped[i].eta = formatDuration(cumulative);
        cumulative += getEtaMsForOrder(orders[i]);
      }
    }
    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/orders/:orderId/claim (delivery agent claims an unassigned order)
const claimOrder = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "Delivery Agent") {
      return res
        .status(403)
        .json({ message: "Only delivery agents can claim orders" });
    }

    const { orderId } = req.params;
    const userId = user._id || user.id;

    const order = await Order.findById(orderId);
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

    const activeAssignedOrders = await Order.countDocuments({
      assignedAgent: userId,
      status: { $in: ["assigned", "shipped", "out-for-delivery"] },
      _id: { $ne: order._id },
    });

    if (activeAssignedOrders > 0) {
      return res.status(403).json({
        message:
          "Complete your current active delivery before claiming another order.",
      });
    }

    order.assignedAgent = userId;
    order.claimedBy = userId;
    order.claimedAt = new Date();
    order.status = "assigned";
    await order.save();

    await createOrderEventNotifications(order, "claimed");

    // Automatically generate and dispatch delivery verification OTP to customer
    try {
      await deliveryOtpService.generateDeliveryOtp(order._id, user);
    } catch (otpErr) {
      console.warn("Auto OTP generation on claim:", otpErr.message);
    }

    const populated = await Order.findById(order._id)
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name");

    res.json({
      success: true,
      data: mapOrderToRecord(populated, user),
      message:
        "Order claimed successfully. Verification OTP dispatched to customer.",
    });
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

// POST /api/deliveries/orders/:orderId/accept (agent accepts verified order -> Shipped)
const acceptOrder = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "Delivery Agent") {
      return res
        .status(403)
        .json({ message: "Only delivery agents can accept orders" });
    }

    const { orderId } = req.params;
    const userId = user._id || user.id;

    const order = await Order.findById(orderId);
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
        message: `Cannot accept an order in '${order.status}' status`,
      });
    }

    if (
      !order.assignedAgent ||
      String(order.assignedAgent._id || order.assignedAgent) !== String(userId)
    ) {
      return res.status(403).json({ message: "Order not assigned to you" });
    }

    if (!order.customerVerified) {
      return res.status(403).json({
        message:
          "Customer OTP verification required before accepting delivery.",
      });
    }

    order.status = "shipped";
    order.shippedAt = new Date();
    await order.save();

    await createOrderEventNotifications(order, "accepted");
    await createOrderEventNotifications(order, "shipped");

    const populated = await Order.findById(order._id)
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name");

    res.json({ success: true, data: mapOrderToRecord(populated, user) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/deliveries/:id/status - update status (owner or agent)
const updateDeliveryStatus = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status, completionPhoto } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid order id" });

    const order = await Order.findById(id);
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
      "completed",
      "delivered",
      "cancelled",
    ];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (status === "completed" || status === "delivered") {
      if (completionPhoto) {
        order.completionPhoto = completionPhoto;
      }
      order.deliveredAt = new Date();
    }

    if (status) order.status = status;
    if (status === "shipped") order.shippedAt = new Date();
    await order.save();

    if (status) {
      await createOrderEventNotifications(order, status);
    }

    const populated = await Order.findById(order._id)
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name");
    res.json({ success: true, data: mapOrderToRecord(populated, user) });
  } catch (err) {
    next(err);
  }
};

const getActiveDeliveries = async (req, res, next) => {
  try {
    const user = req.user;
    const active = await Order.find({
      status: { $in: ["assigned", "shipped", "out-for-delivery"] },
    })
      .populate("items.product")
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName");
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
    const filter = {
      status: { $in: ["completed", "delivered", "failed", "returned"] },
    };
    if (agentId) {
      filter.assignedAgent = agentId;
    }
    const history = await Order.find(filter)
      .populate("items.product")
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName")
      .sort({ deliveredAt: -1 });
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
    const isAgent = user && user.role === "Delivery Agent";

    const activeFilter = {
      status: { $in: ["assigned", "shipped", "out-for-delivery"] },
    };
    const completedFilter = { status: { $in: ["completed", "delivered"] } };
    const followUpFilter = { status: "failed" };

    if (isAgent && agentId) {
      activeFilter.assignedAgent = agentId;
      completedFilter.assignedAgent = agentId;
      followUpFilter.assignedAgent = agentId;
    }

    const activeDeliveriesCount = await Order.countDocuments(activeFilter);
    const completedDeliveriesCount =
      await Order.countDocuments(completedFilter);
    const followUps = await Order.countDocuments(followUpFilter);

    const activeDeliveries = await Order.find(activeFilter)
      .populate("items.product")
      .populate("customerId", "fullName email phone phoneNumber")
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
      assignedAgent: agentId,
      status: { $in: ["completed", "delivered"] },
    }).select("totalPrice");

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
  getAllDeliveries,
  claimOrder,
  assignOrder,
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
};
