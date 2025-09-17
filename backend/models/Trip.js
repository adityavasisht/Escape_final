const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripName: { type: String, required: true },
  totalBudget: { type: Number, required: true },
  locations: [{ type: String, required: true }],
  departureDateTime: { type: Date },
  transportMedium: { type: String },
  departureLocation: { type: String },
  arrivalDateTime: { type: Date },
  arrivalLocation: { type: String },
  description: { type: String },
  inclusions: { type: String },
  exclusions: { type: String },
  maxCapacity: { type: Number, required: true },
  currentBookings: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  adminId: { type: String, required: true },
  agencyId: { type: String },
  agencyName: { type: String },
  tripOTP: {
    type: String,
    required: true,
    unique: true
  },
  itineraryImages: [{
    url: String,
    publicId: String,
    originalName: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

tripSchema.pre('save', function(next) {
  if (this.isNew) {
    this.tripOTP = Math.floor(1000 + Math.random() * 9000).toString();
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);