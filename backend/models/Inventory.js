const mongoose = require('mongoose');
const inventorySchema = new mongoose.Schema({
  productId: String,
  name: String,
  quantity: Number,
  reserved: { type: Number, default: 0 }
});

module.exports = mongoose.model('Inventory', inventorySchema);