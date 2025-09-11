const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripName: {
    type: String,
    required: true
  },
  totalBudget: {
    type: Number,
    required: true
  },
  locations: [{
    type: String,
    required: true
  }],
  departureDateTime: Date,
  transportMedium: String,
  departureLocation: String,
  arrivalDateTime: Date,
  arrivalLocation: String,
  description: String,
  inclusions: String,
  exclusions: String,
  maxCapacity: {
    type: Number,
    required: true
  },
  currentBookings: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: 'active'
  },
  adminId: String,
  agencyName: String,
  itineraryImages: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    originalName: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Trip', tripSchema);
