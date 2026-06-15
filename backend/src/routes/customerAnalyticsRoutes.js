const express = require("express")
const router = express.Router()
const authenticateToken = require("../middleware/authenticateToken")
const {
  getAnalytics,
  getAnalyticsById,
  createAnalytics,
  updateAnalytics,
  deleteAnalytics,
  getCustomerAnalyticsSummary,
} = require("../controllers/customerAnalyticsController")

router.get("/", getAnalytics)
router.get("/summary", authenticateToken, getCustomerAnalyticsSummary)
router.get("/:id", getAnalyticsById)
router.post("/", createAnalytics)
router.put("/:id", updateAnalytics)
router.delete("/:id", deleteAnalytics)

module.exports = router
