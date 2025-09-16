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
  adminId: { type: String, required: true }, // ← Keep this as required
  agencyId: { type: String }, // ← REMOVE 'required: true' - make it optional
  agencyName: { type: String },
  itineraryImages: [{
    url: String,
    publicId: String,
    originalName: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trip', tripSchema);
