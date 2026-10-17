const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');

router.post('/', deliveryController.createDelivery);
router.post('/:deliveryId/assign', deliveryController.assignDelivery);
router.put('/:deliveryId', deliveryController.updateDeliveryStatus);
router.get('/', deliveryController.getDeliveries);

module.exports = router;
