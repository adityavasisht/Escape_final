const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip.js'); // Make sure this path is correct

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

module.exports = router;
