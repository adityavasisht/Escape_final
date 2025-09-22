const mongoose = require('mongoose');

// Define the schema
const bargainRequestSchema = new mongoose.Schema({
  budget: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  destination: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  
  // Customer fields - NOT REQUIRED
  customerId: { type: String, required: false, default: 'anonymous' },
  customerName: { type: String, required: false, default: 'Customer' },
  customerEmail: { type: String, required: false, default: '' },
  
  userName: { type: String, default: 'Customer' },
  status: { 
    type: String, 
    enum: ['pending', 'waiting_list', 'rejected', 'cancelled'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  // Force collection to use new schema
  strict: false,
  collection: 'bargainrequests'
});

// Clear any cached model
if (mongoose.models.BargainRequest) {
  delete mongoose.models.BargainRequest;
}

// Create and export the model
const BargainRequest = mongoose.model('BargainRequest', bargainRequestSchema);

module.exports = BargainRequest;
