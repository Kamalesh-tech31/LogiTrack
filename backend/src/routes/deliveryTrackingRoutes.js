const express = require("express")
const router = express.Router()
const {
  getAllDeliveryTracks,
  getDeliveryByOrderId,
  createDeliveryTrack,
  updateDeliveryTrack,
  deleteDeliveryTrack,
} = require("../controllers/deliveryTrackingController")

router.get("/", getAllDeliveryTracks)
router.get("/order/:orderId", getDeliveryByOrderId)
router.post("/", createDeliveryTrack)
router.put("/:id", updateDeliveryTrack)
router.delete("/:id", deleteDeliveryTrack)

module.exports = router
