const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('admin', 'staff',"user"), orderController.createOrder);
router.get('/:id', orderController.getOrderById);
router.put('/:id', orderController.updateOrder); // Full update
router.patch('/:id/status', orderController.updateOrderStatus); // Status update
router.delete('/:id', authenticate, authorize('admin'), orderController.deleteOrder);
router.get('/', orderController.getAllOrders);
router.get('/export/csv', orderController.exportOrdersToCSV);

module.exports = router;