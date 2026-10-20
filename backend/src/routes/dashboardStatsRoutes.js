const express = require("express");
const authenticateAdmin = require("../middleware/authenticateAdmin");
const router = express.Router();

const {
  getDashboardStats,
  getDashboardStatsById,
  createDashboardStats,
  updateDashboardStats,
  deleteDashboardStats,
} = require("../controllers/dashboardStatsController");

router.get("/", getDashboardStats);
router.get("/:id", getDashboardStatsById);
router.post("/", authenticateAdmin, createDashboardStats);
router.put("/:id", authenticateAdmin, updateDashboardStats);
router.delete("/:id", authenticateAdmin, deleteDashboardStats);

module.exports = router;
