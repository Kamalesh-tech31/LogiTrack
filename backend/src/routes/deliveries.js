const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const {
  getAllDeliveries,
  getActiveDeliveries,
  getHistoryDeliveries,
  getDashboard,
  getEarnings,
  updateDeliveryStatus,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  acceptOrder,
  assignOrder,
  getDeliveries,
  resendDeliveryOtp,
} = require("../controllers/deliveryController.js");

const router = express.Router();
router.use(authenticateToken);

// Dashboard
router.get("/dashboard", getDashboard);

// Earnings
router.get("/earnings", getEarnings);

// History
router.get("/history", getHistoryDeliveries);

// All deliveries
router.get("/", getAllDeliveries);

// Accept order as delivery agent
router.post("/orders/:orderId/accept", acceptOrder);

// Resend OTP to customer (assigned agent or owner)
router.post("/orders/:orderId/resend-otp", resendDeliveryOtp);

// Owner assigns an agent to an order
router.post("/orders/:orderId/assign", assignOrder);

// Create delivery
router.post("/", createDelivery);

// Update whole delivery (PUT)
router.put("/:id", updateDelivery);

// Delete delivery
router.delete("/:id", deleteDelivery);

// Update delivery status
router.patch("/:id/status", updateDeliveryStatus);

module.exports = router;
