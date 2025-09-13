const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  ownerId: { // Link to Clerk user ID
    type: String,
    required: true,
    unique: true // Each Clerk user can only have one agency
  },
  ownerName: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  gstNumber: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  }
});

module.exports = mongoose.model('Agency', agencySchema);
