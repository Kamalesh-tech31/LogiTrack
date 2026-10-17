const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Order = require("../models/Order");
const User = require("../models/User");
const { computeRouteSequenceRoad } = require("../utils/geo");

const DELIVERY_OTP_EXPIRY_MINUTES = Number(
  process.env.DELIVERY_OTP_EXPIRY_MINUTES || 10,
);
const OTP_RESEND_COOLDOWN_SECONDS = 30;
const MAX_OTP_ATTEMPTS = 5;

function isDeliveryAgent(user) {
  if (!user) return false;
  const role = String(
    user.role ||
      user._doc?.role ||
      user.userType ||
      user.accountType ||
      user.type ||
      "",
  ).trim();

  // Explicit match for canonical LogiTrack delivery agent role
  if (
    role === "Delivery Agent" ||
    role === "delivery agent" ||
    role === "delivery_agent" ||
    role === "delivery-agent" ||
    role === "agent" ||
    role === "driver"
  ) {
    return true;
  }

  const normalized = role.toLowerCase().replace(/[-_ ]/g, "");
  // Strictly prevent other canonical roles from claiming delivery permissions
  if (
    normalized === "businessowner" ||
    normalized === "customer" ||
    normalized === "admin" ||
    normalized === "user"
  ) {
    return false;
  }

  return (
    normalized === "deliveryagent" ||
    normalized === "agent" ||
    normalized === "driver" ||
    normalized.includes("delivery") ||
    normalized.includes("agent")
  );
}

function generateOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function getEmailTransporter() {
  // 1. Primary: Brevo SMTP Relay
  if (process.env.BREVO_USER && process.env.BREVO_PASS) {
    return {
      transporter: nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 2525,
        secure: false,
        auth: {
          user: process.env.BREVO_USER,
          pass: process.env.BREVO_PASS,
        },
      }),
      from: `"LogiTrack Delivery" <${process.env.GMAIL_USER || "logitrack862@gmail.com"}>`,
    };
  }

  // 2. Secondary: Gmail App Password
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return {
      transporter: nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      }),
      from: `"LogiTrack Delivery" <${process.env.GMAIL_USER}>`,
    };
  }

  // 3. Fallback: Generic EMAIL_USER / EMAIL_PASS
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return {
      transporter: nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      }),
      from: `"LogiTrack Delivery" <${process.env.EMAIL_USER}>`,
    };
  }

  return null;
}

const { buildDeliveryOtpEmail } = require("../utils/emailTemplate");

function buildDeliveryOtpEmailHtml(otp, orderId, expiryMinutes) {
  return buildDeliveryOtpEmail(otp, orderId, expiryMinutes);
}

/**
 * Generate a secure delivery OTP for an order and dispatch it to the customer.
 */
async function generateDeliveryOtp(orderId, requesterUser) {
  if (!requesterUser) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const requesterId = String(requesterUser._id || requesterUser.id || "");
  let cleanOrderId = String(orderId || "").replace(/^deliv_/, "").trim();
  let order = null;

  if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
    order = await Order.findById(cleanOrderId).populate(
      "customerId",
      "fullName email phone phoneNumber",
    );
  }
  if (!order) {
    order = await Order.findOne({ orderId: cleanOrderId }).populate(
      "customerId",
      "fullName email phone phoneNumber",
    );
  }

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const customerId = order.customerId?._id
    ? String(order.customerId._id)
    : String(order.customerId || "");
  const assignedAgentId = order.assignedAgent?._id
    ? String(order.assignedAgent._id)
    : String(order.assignedAgent || "");
  const ownerId = order.ownerId?._id
    ? String(order.ownerId._id)
    : String(order.ownerId || "");

  const isCustomer = customerId && customerId === requesterId;
  const isAssignedAgent = assignedAgentId && assignedAgentId === requesterId;
  const isOwner = ownerId && ownerId === requesterId;

  if (!isCustomer && !isAssignedAgent && !isOwner) {
    const error = new Error(
      "Not authorized to generate verification OTP for this order",
    );
    error.statusCode = 403;
    throw error;
  }

  // Delivery Agent can ONLY request OTP after arriving at the customer location
  if (isAssignedAgent) {
    if (
      order.deliveryStage !== "AT_CUSTOMER" &&
      order.deliveryStage !== "OTP_REQUESTED"
    ) {
      const error = new Error(
        "Delivery verification OTP can only be requested after reaching the customer location.",
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const terminalStatuses = [
    "completed",
    "delivered",
    "failed",
    "returned",
    "cancelled",
  ];
  if (terminalStatuses.includes(order.status)) {
    const error = new Error(
      `Cannot generate verification OTP for an order in '${order.status}' status`,
    );
    error.statusCode = 400;
    throw error;
  }

  // Resend Cooldown Enforcement: 30 seconds
  const now = new Date();
  if (order.deliveryOtp?.createdAt) {
    const elapsedSeconds =
      (now.getTime() - new Date(order.deliveryOtp.createdAt).getTime()) / 1000;
    if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitRemaining = Math.ceil(
        OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds,
      );
      const error = new Error(
        `Please wait ${waitRemaining} seconds before requesting another OTP.`,
      );
      error.statusCode = 429;
      throw error;
    }
  }

  // Customer Email Resolution
  let customerEmail = (
    order.customerId?.email ||
    order.deliveryAddress?.email ||
    order.customerEmail ||
    ""
  ).trim();

  // If customerId was not fully populated, look up user directly
  if (!customerEmail && order.customerId) {
    const custUser = await User.findById(order.customerId).select("email");
    if (custUser?.email) {
      customerEmail = custUser.email.trim();
    }
  }

  if (!customerEmail) {
    const error = new Error(
      "Customer email address not found for this order. Cannot dispatch verification OTP.",
    );
    error.statusCode = 400;
    throw error;
  }

  const otp = generateOtpCode();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(
    now.getTime() + DELIVERY_OTP_EXPIRY_MINUTES * 60 * 1000,
  );

  // Rotate/Save OTP State in Database
  order.deliveryOtp = {
    codeHash: otpHash,
    expiresAt,
    attempts: 0,
    createdAt: now,
  };
  order.deliveryStage = "OTP_REQUESTED";
  await order.save();

  // Send Email Dispatch via Verified Transporter
  const mailer = getEmailTransporter();
  if (mailer) {
    try {
      const html = buildDeliveryOtpEmailHtml(
        otp,
        order.orderId || order._id.toString(),
        DELIVERY_OTP_EXPIRY_MINUTES,
      );

      const formattedOrderId = order.orderId
        ? `#${order.orderId}`
        : `#${order._id.toString().slice(-6)}`;

      await mailer.transporter.sendMail({
        from: mailer.from,
        to: customerEmail,
        subject: `Delivery Verification OTP for Order ${formattedOrderId}`,
        html,
      });

      console.log(
        `[Delivery OTP] Successfully sent OTP email to ${customerEmail} for order ${formattedOrderId}`,
      );
    } catch (mailErr) {
      console.error("[Delivery OTP] SMTP dispatch error:", mailErr.message);
      const error = new Error(
        `Failed to deliver verification email to ${customerEmail}: ${mailErr.message}`,
      );
      error.statusCode = 502;
      throw error;
    }
  } else {
    console.warn(
      "[Delivery OTP] No SMTP configuration found in environment. Email skipped in dev mode.",
    );
  }

  return {
    success: true,
    message: `Verification code sent to customer (${customerEmail})`,
    orderId: order._id,
    expiresAt,
    resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
  };
}

/**
 * Verify customer delivery OTP submitted by assigned delivery agent.
 */
async function verifyDeliveryOtp(orderId, otp, deliveryAgentUser) {
  if (!deliveryAgentUser) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  if (!isDeliveryAgent(deliveryAgentUser)) {
    const error = new Error("Only delivery agents can verify delivery OTPs");
    error.statusCode = 403;
    throw error;
  }

  const agentId = String(deliveryAgentUser._id || deliveryAgentUser.id || "");
  let cleanOrderId = String(orderId || "").replace(/^deliv_/, "").trim();
  let order = null;

  if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
    order = await Order.findById(cleanOrderId);
  }
  if (!order) {
    order = await Order.findOne({ orderId: cleanOrderId });
  }

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const assignedAgentId = order.assignedAgent?._id
    ? String(order.assignedAgent._id)
    : String(order.assignedAgent || "");

  if (!assignedAgentId || assignedAgentId !== agentId) {
    const error = new Error(
      "You are not the assigned delivery agent for this order",
    );
    error.statusCode = 403;
    throw error;
  }

  const validDeliveryStatuses = ["assigned", "shipped", "out-for-delivery"];
  if (!validDeliveryStatuses.includes(order.status)) {
    const error = new Error(
      `Cannot verify delivery OTP for order with status '${order.status}'`,
    );
    error.statusCode = 400;
    throw error;
  }

  if (!order.deliveryOtp || !order.deliveryOtp.codeHash) {
    if (order.customerVerified) {
      const error = new Error(
        "This order has already been verified for delivery",
      );
      error.statusCode = 400;
      throw error;
    }
    const error = new Error(
      "No active verification OTP found for this order. Please request a new OTP.",
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    !order.deliveryOtp.expiresAt ||
    new Date(order.deliveryOtp.expiresAt).getTime() < Date.now()
  ) {
    const error = new Error(
      "Verification OTP has expired. Please request a new code.",
    );
    error.statusCode = 400;
    throw error;
  }

  if ((order.deliveryOtp.attempts || 0) >= MAX_OTP_ATTEMPTS) {
    order.deliveryOtp.codeHash = null;
    await order.save();
    const error = new Error(
      "Too many invalid attempts. This OTP has been invalidated. Please request a new OTP.",
    );
    error.statusCode = 429;
    throw error;
  }

  const trimmedOtp = String(otp || "").trim();
  const isMatch = await bcrypt.compare(trimmedOtp, order.deliveryOtp.codeHash);

  if (!isMatch) {
    order.deliveryOtp.attempts = (order.deliveryOtp.attempts || 0) + 1;
    if (order.deliveryOtp.attempts >= MAX_OTP_ATTEMPTS) {
      order.deliveryOtp.codeHash = null;
    }
    await order.save();

    const remainingAttempts = MAX_OTP_ATTEMPTS - (order.deliveryOtp.attempts || 0);
    const error = new Error(
      remainingAttempts > 0
        ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
        : "Invalid OTP. Maximum attempts exceeded. Please request a new OTP.",
    );
    error.statusCode = 400;
    throw error;
  }

  // Successful verification
  const now = new Date();
  order.customerVerified = true;
  order.verifiedAt = now;
  order.status = "delivered";
  order.deliveryStage = "DELIVERED";
  order.deliveredAt = now;
  order.deliveryOtp.codeHash = null; // consume single-use OTP

  const customerLat = Number(order.deliveryAddress?.latitude) || null;
  const customerLng = Number(order.deliveryAddress?.longitude) || null;
  if (customerLat != null && customerLng != null && !isNaN(customerLat) && !isNaN(customerLng)) {
    order.agentLocation = {
      latitude: customerLat,
      longitude: customerLng,
      accuracy: null,
      updatedAt: now,
    };
  }

  await order.save();

  // If part of a bulk batch, dynamically re-calculate road route for remaining unvisited orders
  // starting from THIS delivered customer's location (currentLocation = Customer K)
  if (order.batchId && customerLat != null && customerLng != null) {
    try {
      const remainingOrders = await Order.find({
        batchId: order.batchId,
        assignedAgent: order.assignedAgent,
        status: { $nin: ["delivered", "completed", "failed", "cancelled"] },
        deliveryStage: { $ne: "DELIVERED" },
      });

      if (remainingOrders.length > 0) {
        const remainingStops = remainingOrders
          .filter(
            (o) =>
              o.deliveryAddress &&
              !isNaN(Number(o.deliveryAddress.latitude)) &&
              !isNaN(Number(o.deliveryAddress.longitude)),
          )
          .map((o) => ({
            id: o._id.toString(),
            lat: Number(o.deliveryAddress.latitude),
            lng: Number(o.deliveryAddress.longitude),
          }));

        if (remainingStops.length > 0) {
          const nextSequence = await computeRouteSequenceRoad(
            { lat: customerLat, lng: customerLng },
            remainingStops,
          );
          const currentCompletedSeq = order.sequenceOrder || 1;
          for (let i = 0; i < nextSequence.length; i++) {
            await Order.findByIdAndUpdate(nextSequence[i], {
              sequenceOrder: currentCompletedSeq + 1 + i,
              agentLocation: {
                latitude: customerLat,
                longitude: customerLng,
                accuracy: null,
                updatedAt: now,
              },
            });
          }
        }
      }
    } catch (recalcErr) {
      console.warn(
        "[Bulk Route] Dynamic next-stop recalculation error:",
        recalcErr.message,
      );
    }
  }

  return {
    success: true,
    message: "Customer delivery OTP verified successfully",
    orderId: order._id,
    customerVerified: true,
    verifiedAt: order.verifiedAt,
  };
}

module.exports = {
  isDeliveryAgent,
  generateDeliveryOtp,
  verifyDeliveryOtp,
};
