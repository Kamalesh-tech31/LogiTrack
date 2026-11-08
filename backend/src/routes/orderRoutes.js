const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authenticateToken = require("../middleware/authenticateToken");

router.post("/", authenticateToken, orderController.createOrder);
router.get("/", authenticateToken, orderController.getOrders);
router.get("/business", authenticateToken, orderController.getBusinessOrders);
router.get("/:id", authenticateToken, orderController.getOrderById);
router.delete("/:id", authenticateToken, orderController.deleteOrder);

module.exports = router;
