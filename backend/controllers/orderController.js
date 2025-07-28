const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const { exportToCSV } = require('../utils/csvExport');

exports.createOrder = async (req, res) => {
  try {
    const { customerName, items, paymentReceived } = req.body;

    for (let item of items) {
      const inventoryItem = await Inventory.findOne({ productId: item.productId });
      if (!inventoryItem || inventoryItem.quantity - inventoryItem.reserved < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
      }
      inventoryItem.reserved += item.quantity;
      await inventoryItem.save();
    }

    const newOrder = new Order({ customerName, items, paymentReceived });
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Enforce status pipeline
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const allowedTransitions = {
      PENDING: ['PAID', 'CANCELLED'],
      PAID: ['FULFILLED', 'CANCELLED'],
      FULFILLED: [],
      CANCELLED: []
    };

    if (!allowedTransitions[order.status].includes(status)) {
      return res.status(400).json({ message: `Cannot change status from ${order.status} to ${status}` });
    }

    order.status = status;
    await order.save();

    // Emit real-time update (see below)
    if (req.app.get('io')) {
      req.app.get('io').emit('orderStatusUpdated', { orderId: order._id, status: order.status });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, customerName } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customerName) filter.customerName = new RegExp(customerName, 'i');

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportOrdersToCSV = async (req, res) => {
  try {
    const orders = await Order.find();
    const csv = exportToCSV(orders);
    res.header('Content-Type', 'text/csv');
    res.attachment('orders.csv');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
