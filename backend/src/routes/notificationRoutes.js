const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authenticateToken, getNotifications);
router.patch("/read-all", authenticateToken, markAllNotificationsRead);
router.patch("/:id/read", authenticateToken, markNotificationRead);

module.exports = router;