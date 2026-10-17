const express = require("express")
const authenticateToken = require("../middleware/authenticateToken");
const router = express.Router();

const {
  getDashboardStats,
  getDashboardStatsById,
  createDashboardStats,
  updateDashboardStats,
  deleteDashboardStats,
} = require("../controllers/dashboardStatsController")

router.get("/", getDashboardStats)
router.get("/:id", getDashboardStatsById)
router.post("/", authenticateToken, createDashboardStats)
router.put("/:id", authenticateToken, updateDashboardStats)
router.delete("/:id", authenticateToken, deleteDashboardStats)

module.exports = router
