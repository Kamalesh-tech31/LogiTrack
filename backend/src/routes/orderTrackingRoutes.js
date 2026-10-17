const express = require("express")
const router = express.Router()
const {
  getAllTrackings,
  getTrackingByOrderId,
  createTracking,
  updateTracking,
  deleteTracking,
} = require("../controllers/orderTrackingController")

router.get("/", getAllTrackings)
router.get("/order/:orderId", getTrackingByOrderId)
router.post("/", createTracking)
router.put("/:id", updateTracking)
router.delete("/:id", deleteTracking)

module.exports = router
