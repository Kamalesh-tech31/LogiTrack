const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();
const { isBusinessOwner } = require('../services/deliveryOtpService');

router.use(authenticateToken);

// Only Business Owners may access analytics routes
router.use((req, res, next) => {
  if (!isBusinessOwner(req.user)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  next();
});

const analyticsController = require('../controllers/analyticsController');

router.get('/', analyticsController.getAnalytics);

module.exports = router;
