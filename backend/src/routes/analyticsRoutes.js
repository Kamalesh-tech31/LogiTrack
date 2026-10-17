const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

router.use(authenticateToken);
const analyticsController = require('../controllers/analyticsController');

router.get('/', analyticsController.getAnalytics);

module.exports = router;
