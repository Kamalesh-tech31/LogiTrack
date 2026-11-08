const express = require("express")
const router = express.Router()
const authenticateToken = require("../middleware/authenticateToken")
const {
  getCustomerAnalyticsSummary,
} = require("../controllers/customerAnalyticsController")

router.get("/summary", authenticateToken, getCustomerAnalyticsSummary)

module.exports = router
