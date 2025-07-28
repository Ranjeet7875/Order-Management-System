const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: String,
  customerEmail: String,
  items: [
    {
      productId: String,
      name: String,
      quantity: Number
    }
  ],
  paymentReceived: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'],
    default: 'PENDING'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
