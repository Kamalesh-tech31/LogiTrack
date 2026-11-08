const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const {
  getAllDeliveryAgents,

  createDeliveryAgent,


} = require("../controllers/deliveryAgentController");

const router = express.Router();
router.use(authenticateToken);

router.get("/", getAllDeliveryAgents);

router.post("/", createDeliveryAgent);



module.exports = router;
