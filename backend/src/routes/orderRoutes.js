const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/', orderController.createOrder);
router.get('/', authenticateToken, orderController.getOrders);
router.get('/business', authenticateToken, orderController.getBusinessOrders);
router.get('/:id', authenticateToken, orderController.getOrderById);
router.put('/:id', orderController.updateOrderStatus);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
