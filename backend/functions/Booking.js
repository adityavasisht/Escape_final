const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Trip information
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  tripOTP: {
    type: String,
    required: true
  },
  
  // Customer information
  customerId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  
  // Admin/Agency information
  adminId: {
    type: String,  
    required: true
  },
  agencyName: {
    type: String,
    required: true
  },
  
  // Booking details
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled'],
    default: 'confirmed'
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Additional details
  specialRequests: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
