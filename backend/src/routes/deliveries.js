const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const {
  checkAgentAvailability,
  addOrderToBatch,
  getAllDeliveries,
  getActiveDeliveries,
  getHistoryDeliveries,
  getDashboard,
  getEarnings,
  updateDeliveryStatus,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  claimOrder,
  reachedWarehouse,
  reachedCustomer,
  updateAgentTelemetry,
  acceptOrder,
  assignOrder,
  getDeliveries,
  generateDeliveryOtp,
  verifyCustomerOtp,
  getNearbyOrders,
  bulkClaimOrders,
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

// Agent availability & batch info
router.get("/agent/:agentId/availability", checkAgentAvailability);

// Nearby eligible orders for bulk delivery
router.get("/orders/:orderId/nearby", getNearbyOrders);

// Bulk claim orders
router.post("/bulk-claim", bulkClaimOrders);
router.post("/orders/:orderId/bulk-claim", bulkClaimOrders);

// Claim order as delivery agent (requires GPS in body)
router.post("/orders/:orderId/claim", claimOrder);

// Agent milestone updates
router.post("/orders/:orderId/reached-warehouse", reachedWarehouse);
router.post("/orders/:orderId/reached-customer", reachedCustomer);
router.post("/orders/:orderId/telemetry", updateAgentTelemetry);

// Add order to batch
router.post("/orders/:orderId/add-to-batch", addOrderToBatch);

// Generate delivery verification OTP (after reaching customer)
router.post("/orders/:orderId/generate-otp", generateDeliveryOtp);

// Verify customer delivery OTP (delivery agent)
router.post("/orders/:orderId/verify-customer", verifyCustomerOtp);

// Accept order as delivery agent
router.post("/orders/:orderId/accept", acceptOrder);

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
