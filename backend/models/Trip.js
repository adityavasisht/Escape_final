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
  agencyId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Agency',
  required: true
},
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
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  reviews: [{
    userId: String,
    rating: { 
      type: Number, 
      min: 1, 
      max: 5,
      required: true
    },
    comment: String,
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Trip', tripSchema);