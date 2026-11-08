const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();
router.use(authenticateToken);

module.exports = router;
