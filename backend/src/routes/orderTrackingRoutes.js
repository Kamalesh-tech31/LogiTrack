const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const router = express.Router();
const { getTrackingByOrderId } = require("../controllers/orderTrackingController");

router.get("/order/:orderId", authenticateToken, getTrackingByOrderId);

module.exports = router;
