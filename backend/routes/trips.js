const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');

console.log('📁 Trips routes module loaded');

// Get all trips (public endpoint)
router.get('/', async (req, res) => {
  console.log('🎯 GET /api/trips route hit');
  
  try {
    const trips = await Trip.find({ status: 'active' })
      .select('tripName totalBudget locations description departureDateTime arrivalDateTime transportMedium maxCapacity currentBookings itineraryImages createdAt')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${trips.length} active trips in database`);
    
    res.json({
      success: true,
      trips: trips,
      total: trips.length,
      message: 'Active trips retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching trips:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while fetching trips'
    });
  }
});

// Get single trip by ID
router.get('/:id', async (req, res) => {
  console.log(`🎯 GET /api/trips/${req.params.id} route hit`);
  
  try {
    const tripId = req.params.id;
    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }
    
    console.log(`✅ Trip found: ${trip.tripName}`);
    
    res.json({
      success: true,
      trip: trip,
      message: 'Trip retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching trip:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while fetching trip'
    });
  }
});

console.log('✅ Trips routes configured with database integration');

module.exports = router;
