const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip.js'); // Make sure this path is correct
const BargainRequest = require('../models/BargainRequest.js');
const Agency = require('../models/Agency.js');

// Admin route - Get all trips for admin dashboard
router.get('/admin/trips', async (req, res) => {
  try {
    console.log('🎯 GET /api/admin/trips route hit');
    
    const trips = await Trip.find({})
      .sort({ createdAt: -1 });

    console.log('✅ Admin found', trips.length, 'trips');

    res.json({
      success: true,
      trips: trips,
      total: trips.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trips',
      message: error.message
    });
  }
});

// Public route - Get all active trips for homepage
router.get('/public', async (req, res) => {
  try {
    console.log('📡 Public fetching active trips...');
    
    const trips = await Trip.find({ status: 'active' })
      .sort({ createdAt: -1 });

    console.log('✅ Public found', trips.length, 'active trips');

    res.json({
      success: true,
      packages: trips,
      total: trips.length
    });
    
  } catch (error) {
    console.error('❌ Error in public trips route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trips',
      message: error.message
    });
  }
});

// Public route - Get single trip details by ID
router.get('/public/:tripId', async (req, res) => {
  try {
    console.log('🎯 GET /api/trips/public/:tripId route hit for ID:', req.params.tripId);
    
    const trip = await Trip.findById(req.params.tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    console.log('✅ Found trip:', trip.tripName);

    res.json({
      success: true,
      trip: trip
    });
    
  } catch (error) {
    console.error('❌ Error fetching trip details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trip details',
      message: error.message
    });
  }
});

// Admin route - Delete a trip
router.delete('/admin/trips/:tripId', async (req, res) => {
  try {
    console.log('🗑️ Admin deleting trip:', req.params.tripId);
    
    const result = await Trip.findByIdAndDelete(req.params.tripId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    console.log('✅ Trip deleted successfully');

    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting trip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete trip',
      message: error.message
    });
  }
});

// Search trips route
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    console.log('🔍 Search query:', query);
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(query, 'i'); // Case-insensitive search
    
    const trips = await Trip.find({
      status: 'active',
      $or: [
        { locations: { $regex: searchRegex } },
        { tripName: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { agencyName: { $regex: searchRegex } }
      ]
    }).sort({ createdAt: -1 });

    console.log('✅ Found', trips.length, 'trips matching query');

    res.json({
      success: true,
      trips: trips,
      total: trips.length,
      query: query
    });
    
  } catch (error) {
    console.error('❌ Error in search route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search trips',
      message: error.message
    });
  }
});

// FIXED: Get all agencies for dropdown - corrected field selection
router.get('/agencies', async (req, res) => {
  try {
    console.log('📡 Fetching agencies for dropdown...');
    
    // Get agencies with the correct field name from your schema
    const agencies = await Agency.find({ status: 'active' }).select('_id name ownerName');
    
    console.log('✅ Found', agencies.length, 'agencies');
    console.log('Sample agency:', agencies[0]); // Debug log
    
    res.json({
      success: true,
      agencies: agencies.map(agency => ({
        id: agency._id,
        name: agency.name || agency.ownerName // Use name field from your schema
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching agencies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// UPDATED: Submit bargain request with all fields from form
router.post('/bargain', async (req, res) => {
  try {
    console.log('📨 Bargain request received:', req.body);
    
    const { 
      budget, 
      startDate, 
      endDate, 
      destination, 
      selectedAgencies, 
      phoneNumber, 
      taggedTrip 
    } = req.body;
    
    // Validate required fields
    if (!phoneNumber || !taggedTrip || !selectedAgencies || selectedAgencies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Phone number, tagged trip, and at least one agency are required'
      });
    }

    // Create bargain request
    const agencyName = selectedAgencies[0]; // Get the first (and only) agency
    
    // Find agency by name to get ID
    const agency = await Agency.findOne({ name: agencyName });
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Selected agency not found'
      });
    }

    // Find the trip to get trip details
    const trip = await Trip.findById(taggedTrip);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Selected trip not found'
      });
    }

    const request = new BargainRequest({
      budget: parseFloat(budget),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      destination,
      phoneNumber,
      tripId: taggedTrip,
      agencyId: agency._id,
      userName: 'Customer', // You can get this from Clerk user if available
      status: 'pending',
      createdAt: new Date()
    });
    
    await request.save();
    
    console.log('✅ Created bargain request for agency:', agency.name);
    
    res.json({
      success: true,
      message: 'Bargain request submitted successfully',
      requestId: request._id
    });
  } catch (error) {
    console.error('❌ Error submitting bargain request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// Get bargain requests for an agency (for Manage Deals)
router.get('/bargain/requests/owner/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    console.log('📋 Fetching bargain requests for agency owner:', ownerId);
    
    // First find the agency owned by this user
    const agency = await Agency.findOne({ ownerId: ownerId });
    
    if (!agency) {
      return res.json({
        success: true,
        requests: [],
        message: 'No agency found for this owner'
      });
    }
    
    // Then find bargain requests for this agency
    const requests = await BargainRequest.find({ agencyId: agency._id })
      .populate('tripId', 'tripName locations totalBudget') // Populate trip details
      .sort({ createdAt: -1 });
    
    console.log('✅ Found', requests.length, 'bargain requests for agency:', agency.name);
    
    res.json({
      success: true,
      requests,
      agencyName: agency.name
    });
  } catch (error) {
    console.error('❌ Error fetching bargain requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
router.post('/create-agency', async (req, res) => {
  try {
    console.log('🏢 Creating new agency:', req.body);
    
    const { name, ownerId, ownerName, contactEmail, contactPhone, gstNumber, description, status } = req.body;
    
    // Check if agency already exists
    const existingAgency = await Agency.findOne({ 
      $or: [
        { ownerId: ownerId },
        { gstNumber: gstNumber }
      ]
    });
    
    if (existingAgency) {
      return res.status(400).json({
        success: false,
        error: 'Agency with this owner or GST number already exists'
      });
    }
    
    const newAgency = new Agency({
      name,
      ownerId,
      ownerName,
      contactEmail,
      contactPhone,
      gstNumber,
      description: description || '',
      status: status || 'active'
    });
    
    await newAgency.save();
    
    console.log('✅ Agency created successfully');
    
    res.json({
      success: true,
      message: 'Agency created successfully',
      agency: newAgency
    });
    
  } catch (error) {
    console.error('❌ Error creating agency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create agency',
      message: error.message
    });
  }
});
router.get('/agency-details/:agencyName', async (req, res) => {
  try {
    console.log('🏢 Fetching agency details for:', req.params.agencyName);

    const agencyName = decodeURIComponent(req.params.agencyName);

    const agency = await Agency.findOne({ 
      name: agencyName,
      status: 'active' 
    }).select('name contactEmail contactPhone gstNumber description ownerName status createdAt');

    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Agency not found'
      });
    }

    console.log('✅ Found agency details:', agency.name);

    res.json({
      success: true,
      agency: agency
    });

  } catch (error) {
    console.error('❌ Error fetching agency details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agency details',
      message: error.message
    });
  }
});

module.exports = router;
