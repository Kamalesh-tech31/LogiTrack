const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Order = require("../models/Order");
const User = require("../models/User");

const DELIVERY_OTP_EXPIRY_MINUTES = Number(
  process.env.DELIVERY_OTP_EXPIRY_MINUTES || 10,
);
const MAX_OTP_ATTEMPTS = 5;

function generateOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function buildDeliveryOtpEmailHtml(otp, orderId, expiryMinutes) {
  return `
    <div style="font-family: Arial, sans-serif; background:#0b0b0b; color:#ffffff; padding:32px;">
      <div style="max-width:560px; margin:0 auto; background:#111111; border:1px solid #27272a; border-radius:24px; padding:32px;">
        <h1 style="margin:0 0 16px; font-size:32px; line-height:1.1;">Logi<span style="color:#F97316;">Track</span></h1>
        <p style="margin:0 0 24px; color:#d4d4d8; font-size:16px;">
          Your delivery verification code for order <strong>#${orderId}</strong> is ready.
        </p>
        <p style="margin:0 0 16px; color:#a1a1aa; font-size:14px;">
          Please share this One-Time Passcode (OTP) with your assigned delivery partner upon arrival to confirm delivery:
        </p>
        <div style="background:#1a1a1a; border:1px solid #F97316; border-radius:18px; padding:20px; text-align:center; margin:0 0 24px;">
          <div style="font-size:12px; letter-spacing:0.2em; text-transform:uppercase; color:#a1a1aa; margin-bottom:10px;">Delivery Passcode</div>
          <div style="font-size:36px; font-weight:700; letter-spacing:0.3em; color:#ffffff;">${otp}</div>
        </div>
        <p style="margin:0; color:#a1a1aa; font-size:14px;">This code expires in ${expiryMinutes} minutes and can only be used once.</p>
      </div>
    </div>
  `;
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

  const requesterId = String(requesterUser._id || requesterUser.id);
  const order = await Order.findById(orderId).populate(
    "customerId",
    "fullName email phone phoneNumber",
  );

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

  const otp = generateOtpCode();
  const otpHash = await bcrypt.hash(otp, 10);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + DELIVERY_OTP_EXPIRY_MINUTES * 60 * 1000,
  );

  order.deliveryOtp = {
    codeHash: otpHash,
    expiresAt,
    attempts: 0,
    createdAt: now,
  };
  await order.save();

  // Attempt customer email notification if email is configured
  const customerEmail =
    order.customerId?.email ||
    (await User.findById(customerId).select("email"))?.email;

  if (customerEmail && process.env.BREVO_USER && process.env.BREVO_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 2525,
        secure: false,
        auth: {
          user: process.env.BREVO_USER,
          pass: process.env.BREVO_PASS,
        },
      });

      await transporter.sendMail({
        from: "LogiTrack <logitrack862@gmail.com>",
        to: customerEmail,
        subject: `Delivery Verification OTP for Order #${order.orderId}`,
        html: buildDeliveryOtpEmailHtml(
          otp,
          order.orderId,
          DELIVERY_OTP_EXPIRY_MINUTES,
        ),
      });
    } catch (emailErr) {
      console.warn("Failed to dispatch delivery OTP email:", emailErr.message);
    }
  }

  // Never leak OTP to delivery agent response
  if (isAssignedAgent) {
    return {
      success: true,
      message: "Delivery verification OTP generated and dispatched to customer",
      orderId: order._id,
      expiresAt,
    };
  }

  return {
    success: true,
    message: "Delivery verification OTP generated",
    orderId: order._id,
    expiresAt,
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

  if (deliveryAgentUser.role !== "Delivery Agent") {
    const error = new Error("Only delivery agents can verify delivery OTPs");
    error.statusCode = 403;
    throw error;
  }

  const agentId = String(deliveryAgentUser._id || deliveryAgentUser.id);
  const order = await Order.findById(orderId);

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

    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    throw error;
  }

  // Successful verification
  const now = new Date();
  order.customerVerified = true;
  order.verifiedAt = now;
  order.deliveryOtp.codeHash = null; // consume single-use OTP
  await order.save();

  return {
    success: true,
    message: "Customer delivery OTP verified successfully",
    orderId: order._id,
    customerVerified: true,
    verifiedAt: order.verifiedAt,
  };
}

module.exports = {
  generateDeliveryOtp,
  verifyDeliveryOtp,
};
