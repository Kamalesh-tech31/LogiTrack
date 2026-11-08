const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const { isBusinessOwner } = require("../services/deliveryOtpService");

router.use(authenticateToken);

// Only Business Owners may access inventory routes
router.use((req, res, next) => {
  if (!isBusinessOwner(req.user)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  next();
});

router.get("/", inventoryController.getInventory);
router.get("/low", inventoryController.getLowStock);
router.get("/history", inventoryController.getHistory);
router.put("/:productId", inventoryController.updateStock);

module.exports = router;
