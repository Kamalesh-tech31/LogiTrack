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
  acceptOrder,
  assignOrder,
  getDeliveries,
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

// Accept order as delivery agent
router.post("/orders/:orderId/accept", acceptOrder);

// Add order to batch
router.post("/orders/:orderId/add-to-batch", addOrderToBatch);

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
