const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('admin', 'staff', 'user'), orderController.createOrder);
router.get('/:id', authenticate, authorize('admin', 'staff', 'user'), orderController.getOrderById);
router.put('/:id', authenticate, authorize('admin', 'staff', 'user'), orderController.updateOrder); // Full update
router.patch('/:id/status', authenticate, authorize('admin', 'staff', 'user'), orderController.updateOrderStatus); // Status update
router.delete('/:id', authenticate, authorize('admin',"user"), orderController.deleteOrder);
router.get('/', authenticate, authorize('admin', 'staff', 'user'), orderController.getAllOrders);
router.get('/export/csv', authenticate, authorize('admin', 'staff', 'user'), orderController.exportOrdersToCSV);

module.exports = router;