const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  productId: String,
  name: String,
  quantity: Number,
  reserved: { type: Number, default: 0 }
});
module.exports = mongoose.model('Product', productSchema);