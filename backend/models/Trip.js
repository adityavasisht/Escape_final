const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripName: {
    type: String,
    required: true,
    trim: true
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 0
  },
  locations: [{
    type: String,
    required: true
  }],
  departureDateTime: {
    type: Date
  },
  arrivalDateTime: {
    type: Date
  },
  transportMedium: {
    type: String,
    enum: ['bus', 'train', 'flight', 'car', 'boat', 'mixed', 'Not specified'],
    default: 'Not specified'
  },
  departureLocation: {
    type: String,
    default: 'Not specified'
  },
  arrivalLocation: {
    type: String,
    default: 'Not specified'
  },
  description: {
    type: String,
    default: ''
  },
  inclusions: {
    type: String,
    default: ''
  },
  exclusions: {
    type: String,
    default: ''
  },
  maxCapacity: {
    type: Number,
    required: true,
    min: 1
  },
  currentBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'cancelled'],
    default: 'active'
  },
  adminId: {
    type: String,
    required: true,
    index: true
  },
  agencyId: {
    type: String,
    required: true
  },
  agencyName: {
    type: String,
    default: 'Travel Agency'
  },
  // ✅ FIXED OTP FIELD - NOT REQUIRED IN SCHEMA
  tripOTP: {
    type: String,
    unique: true,
    sparse: true // Allows for null/undefined values while maintaining uniqueness for non-null values
  },
  itineraryImages: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String
    },
    originalName: {
      type: String
    }
  }]
}, {
  timestamps: true
});

// ✅ REMOVE THE PRE-SAVE HOOK - Let the backend handle OTP generation
// No pre-save hook for OTP generation since frontend is handling it

// Add indexes for better performance
tripSchema.index({ adminId: 1, status: 1 });
tripSchema.index({ tripOTP: 1 }, { sparse: true });
tripSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
