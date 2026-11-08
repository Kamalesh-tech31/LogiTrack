const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const router = express.Router();
const { getDeliveryByOrderId } = require("../controllers/deliveryTrackingController");

router.get("/order/:orderId", authenticateToken, getDeliveryByOrderId);

module.exports = router;
