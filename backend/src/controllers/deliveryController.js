const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const deliveryOtpService = require("../services/deliveryOtpService");

function formatDuration(ms) {
  if (ms <= 0) return "0m";
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

  // fallback estimate for orders not yet shipped
  return bufferMs;
}

function mapOrderToRecord(o) {
  const addr = o.deliveryAddress || {};
  const isClaimed = Boolean(o.assignedAgent);
  const isVerified = Boolean(o.customerVerified);

  const fullAddress = [
    addr.street,
    addr.city,
    addr.state,
    addr.postalCode,
    addr.country,
  ]
    .filter(Boolean)
    .join(", ");

  const areaAddress =
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ") ||
    addr.city ||
    "Destination Area";

  // Normalize assigned agent if present
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

  // Resolve customerPhone: Order has no direct phone field.
  // It lives on the populated customerId User document.
  const resolvedPhone =
    o.customerId?.phone || o.customerId?.phoneNumber || null;

  // Masking based on claim & verification state:
  // - Unassigned: mask customer name, street address, and contact
  // - Claimed & Unverified: show general area, mask street address & contact
  // - Verified: reveal full customer name, full address, and contact
  let customer =
    o.customerName ||
    (o.customerId ? o.customerId.fullName || o.customerId.toString() : "Customer");
  let address = fullAddress;
  let contact = resolvedPhone || "Contact on file";

  if (!isClaimed) {
    customer = "Available Order";
    address = areaAddress;
    contact = "Hidden";
  } else if (!isVerified) {
    customer = o.customerName || "Customer";
    address = areaAddress;
    contact = "Hidden until OTP verified";
  }

  // Build a safe raw object — strip OTP internal fields before sending to client
  const safeRaw = {
    _id: o._id,
    orderId: o.orderId,
    customerId: o.customerId,
    ownerId: o.ownerId,
    assignedAgent: o.assignedAgent,
    status: o.status,
    customerName: o.customerName,
    customerVerified: o.customerVerified,
    verifiedAt: o.verifiedAt,
    items: o.items,
    totalPrice: o.totalPrice,
    deliveryAddress: isVerified ? o.deliveryAddress : undefined,
    shippedAt: o.shippedAt,
    deliveredAt: o.deliveredAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    // intentionally omitting: deliveryOtp (contains bcrypt hash)
  };

  return {
    id: o._id.toString(),
    orderId: o.orderId,
    customer,
    city: addr.city || null,
    address,
    fullAddress: isVerified ? fullAddress : undefined,
    latitude: addr.latitude || null,
    longitude: addr.longitude || null,
    eta: getEtaForOrder(o),
    status: o.status,
    priority: o.priority || null,
    contact,
    customerPhone: isVerified ? resolvedPhone : undefined,
    customerVerified: isVerified,
    verifiedAt: o.verifiedAt ? o.verifiedAt.toISOString() : null,
    isClaimed,
    agent,
    location: null,
    lastUpdated: o.updatedAt ? o.updatedAt.toISOString() : null,
    raw: safeRaw,
  };
}

// GET /api/deliveries
// Supports query params: owner=true, mine=true, status=...
const getAllDeliveries = async (req, res, next) => {
  try {
    const user = req.user;
    const { owner, mine, status } = req.query;

    // Debug: log requester and query to help trace missing results
    console.debug("getAllDeliveries called", {
      requester: user,
      query: req.query,
    });

    const filter = {};
    // By default exclude terminal/completed statuses from the general deliveries listing
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
      // show only orders assigned to this agent, or unassigned orders if the agent can claim them
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

    const mapped = orders.map(mapOrderToRecord);
    // If this is the agent's route (mine=true) compute cumulative ETA starting at 0
    if (mine === "true") {
      let cumulative = 0;
      for (let i = 0; i < orders.length; i++) {
        // each mapped entry's eta should show time until that stop from route start
        mapped[i].eta = formatDuration(cumulative);
        // add this order's expected duration for the next stops
        cumulative += getEtaMsForOrder(orders[i]);
      }
    }
    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/orders/:orderId/claim (agent claims an available order)
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

    if (order.assignedAgent) {
      return res.status(400).json({
        message: "This order is already assigned or claimed by an agent.",
      });
    }

    const activeAssignedOrders = await Order.countDocuments({
      assignedAgent: userId,
      status: { $nin: terminalStatuses },
      _id: { $ne: order._id },
    });

    if (activeAssignedOrders > 0) {
      return res.status(403).json({
        message:
          "Complete your current delivery before claiming another order.",
      });
    }

    order.assignedAgent = userId;
    order.status = "assigned";
    order.customerVerified = false;
    order.verifiedAt = null;
    await order.save();

    // Generate and dispatch customer verification OTP
    await deliveryOtpService.generateDeliveryOtp(order._id, user);

    const populated = await Order.findById(order._id)
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name");

    res.status(200).json({
      success: true,
      message:
        "Order claimed successfully. Verification OTP dispatched to customer.",
      data: mapOrderToRecord(populated),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/orders/:orderId/assign  (owner assigns an agent)
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

    // Only owner of the product(s) or an Owner role can assign
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

    const populated = await Order.findById(order._id)
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name");
    res.json({ success: true, data: mapOrderToRecord(populated) });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/orders/:orderId/accept  (agent accepts verified order -> Shipped)
const acceptOrder = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "Delivery Agent")
      return res
        .status(403)
        .json({ message: "Only delivery agents can accept orders" });

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

    const activeAssignedOrders = await Order.countDocuments({
      assignedAgent: userId,
      status: { $in: ["shipped", "out-for-delivery"] },
      _id: { $ne: order._id },
    });

    if (activeAssignedOrders > 0) {
      return res.status(403).json({
        message:
          "Complete your current delivery before accepting another order.",
      });
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
    const populated = await Order.findById(order._id)
      .populate("customerId", "fullName email phone phoneNumber")
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name");
    res.json({ success: true, data: mapOrderToRecord(populated) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/deliveries/:id/status  - update status (owner or agent)
const updateDeliveryStatus = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid order id" });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const userId = user ? user._id || user.id : null;

    // Only assigned agent or Owner can update certain statuses
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

    // Validate simple allowed transitions
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
      const completionPhoto = req.body.completionPhoto;
      if (!completionPhoto || typeof completionPhoto !== "string") {
        return res.status(400).json({
          message: "A completion photo is required to complete the order.",
        });
      }
      order.completionPhoto = completionPhoto;
      order.deliveredAt = new Date();
    }

    if (status) order.status = status;
    if (status === "shipped") order.shippedAt = new Date();
    await order.save();

    const populated = await Order.findById(order._id)
      .populate("assignedAgent", "fullName email role")
      .populate("items.product", "name");
    res.json({ success: true, data: mapOrderToRecord(populated) });
  } catch (err) {
    next(err);
  }
};

const getActiveDeliveries = async (req, res, next) => {
  try {
    const active = await Order.find({
      status: { $in: ["assigned", "shipped", "out-for-delivery"] },
    })
      .populate("items.product")
      .populate("assignedAgent", "fullName");
    const mapped = active.map(mapOrderToRecord);
    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (err) {
    next(err);
  }
};

const getHistoryDeliveries = async (req, res, next) => {
  try {
    const agentId = req.user?.id || req.user?._id;
    const filter = {
      status: { $in: ["completed", "delivered", "failed", "returned"] },
    };
    // Filter by current agent's completed deliveries
    if (agentId) {
      filter.assignedAgent = agentId;
    }
    const history = await Order.find(filter)
      .populate("items.product")
      .populate("assignedAgent", "fullName")
      .sort({ deliveredAt: -1 });
    const mapped = history.map(mapOrderToRecord);

    // Compute cumulative ETA: start at 0, add each order's delivery time
    let cumulative = 0;
    for (let i = 0; i < history.length; i++) {
      // Each order shows when it was reached from route start
      mapped[i].eta = formatDuration(cumulative);
      // Add this order's delivery time for next cumulative
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

    // If the requester is a delivery agent, scope dashboard numbers to that agent
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
      .limit(20)
      .sort({ updatedAt: -1 });

    const activeRoutes = activeDeliveries.map(mapOrderToRecord);

    // Compute average time taken for completed deliveries (deliveredAt - shippedAt)
    // Include a 20 minute buffer per delivery update as requested
    const completedForEtaFilter = { ...completedFilter };
    // fetch recent completed/delivered orders with timestamps
    const completedOrdersForEta = await Order.find(completedForEtaFilter)
      .select("shippedAt deliveredAt createdAt")
      .limit(100)
      .sort({ deliveredAt: -1 });

    const EXTRA_MS = 20 * 60 * 1000; // 20 minutes in ms
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
        duration += EXTRA_MS; // add 20 minutes per delivery
        totalMs += duration;
        counted += 1;
      }
    });

    let avgEtaStr = "--";
    if (activeDeliveriesCount > 0) {
      avgEtaStr = `${activeDeliveriesCount * 20}m`;
    } else if (counted > 0) {
      const avgMs = Math.round(totalMs / counted);
      const mins = Math.round(avgMs / 60000);
      if (mins < 60) avgEtaStr = `${mins}m`;
      else {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        avgEtaStr = m === 0 ? `${h}h` : `${h}h ${m}m`;
      }
    }

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
    // Consider both completed and delivered as payable
    const deliveries = await Order.find({
      assignedAgent: agentId,
      status: { $in: ["completed", "delivered"] },
    }).select("totalPrice");

    // Earnings policy: ₹100 per order, ₹200 if order totalPrice > 5000
    let totalEarned = 0;
    deliveries.forEach((d) => {
      const price = Number(d.totalPrice || 0);
      totalEarned += price > 5000 ? 200 : 100;
    });

    // Earnings policy: ₹100 per order, ₹200 if order totalPrice > 5000
    // Bonus policy: ₹100 for each ₹1000 earned
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

// Deprecated: creating standalone Delivery documents is not allowed in the new flow
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
    const { orderId, agentId } = req.query;
    const filter = {};
    // Exclude completed/terminal orders by default when fetching deliveries
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
      .populate("assignedAgent", "fullName");
    const mapped = orders.map(mapOrderToRecord);
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
