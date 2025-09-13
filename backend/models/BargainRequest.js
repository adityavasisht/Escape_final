const mongoose = require('mongoose');

const bargainRequestSchema = new mongoose.Schema({
  budget: {
    type: Number
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  destination: {
    type: String
  },
  userName: {
    type: String,
    default: 'Anonymous User'
  },
  phoneNumber: {
    type: String,
    required: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BargainRequest', bargainRequestSchema);
