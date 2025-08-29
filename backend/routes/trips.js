const express = require('express');
const router = express.Router();

console.log('📁 Trips routes module loaded');

// Get all trips (public endpoint)
router.get('/', async (req, res) => {
  console.log('🎯 GET /api/trips route hit');
  
  try {
    // Sample trips data
    const trips = [
      {
        id: 1,
        tripName: "Golden Triangle Tour",
        totalBudget: 45000,
        locations: ["Delhi", "Agra", "Jaipur"],
        status: "active"
      },
      {
        id: 2,
        tripName: "Kerala Backwaters",
        totalBudget: 35000,
        locations: ["Kochi", "Alleppey", "Munnar"],
        status: "active"
      }
    ];
    
    res.json({
      success: true,
      trips: trips
    });
  } catch (error) {
    console.error('❌ Error fetching trips:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single trip by ID
router.get('/:id', async (req, res) => {
  console.log(`🎯 GET /api/trips/${req.params.id} route hit`);
  
  try {
    const tripId = parseInt(req.params.id);
    
    const trip = {
      id: tripId,
      tripName: "Sample Trip",
      totalBudget: 30000,
      locations: ["Mumbai", "Goa"],
      description: "Amazing coastal trip"
    };
    
    res.json({
      success: true,
      trip: trip
    });
  } catch (error) {
    console.error('❌ Error fetching trip:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ Trips routes configured');

module.exports = router;
