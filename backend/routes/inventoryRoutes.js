const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// Create new inventory item
router.post('/', async (req, res) => {
  try {
    const { productId, name, quantity } = req.body;
    const newItem = new Inventory({ productId, name, quantity });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all inventory
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update inventory quantity
router.put('/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await Inventory.findOne({ productId: req.params.productId });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    item.quantity = quantity;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
