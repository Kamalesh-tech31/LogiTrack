const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const router = express.Router();

const {
  getDashboardStats,
} = require("../controllers/dashboardStatsController");

router.get("/", authenticateToken, getDashboardStats);

module.exports = router;
