const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripName: {
    type: String,
    required: true,
  },
  totalBudget: {
    type: Number,
    required: true,
  },
  locations: [{
    type: String,
    required: true,
  }],
  departureDateTime: {
    type: Date,
    required: true,
  },
  transportMedium: {
    type: String,
    required: true,
  },
  departureLocation: {
    type: String,
    required: true,
  },
  arrivalDateTime: {
    type: Date,
    required: true,
  },
  arrivalLocation: {
    type: String,
    required: true,
  },
  description: String,
  inclusions: String,
  exclusions: String,
  maxCapacity: {
    type: Number,
    required: true,
  },
  currentBookings: {
    type: Number,
    default: 0,
  },
  adminId: {
    type: String,
    required: true,
  },
  agencyName: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Trip', tripSchema);
