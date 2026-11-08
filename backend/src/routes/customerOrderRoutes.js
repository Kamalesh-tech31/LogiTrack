const express = require("express");

const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const {
  getAllOrders,
  getOrderById,
} = require("../controllers/customerOrderController");

// Require authentication for all customer order routes so we can return only the
// orders belonging to the authenticated customer.
router.use(authenticateToken);

router.get("/", getAllOrders);
router.get("/:id", getOrderById);

module.exports = router;
