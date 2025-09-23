const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  name: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true },
  gstNumber: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  userType: { type: String, default: 'admin' }, // ← Add this
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Agency', agencySchema);
