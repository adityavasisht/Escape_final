const express = require('express');
const router = express.Router();

console.log('📁 Admin routes module loaded');

// Create new trip (POST /api/admin/trips)
router.post('/trips', async (req, res) => {
  console.log('🎯 POST /api/admin/trips route hit');
  console.log('📦 Request body:', req.body);
  console.log('🌐 Request origin:', req.headers.origin);
  
  try {
    const {
      tripName,
      totalBudget,
      locations,
      departureDateTime,
      transportMedium,
      departureLocation,
      arrivalDateTime,
      arrivalLocation,
      description,
      inclusions,
      exclusions,
      maxCapacity
    } = req.body;
    
    // Validate required fields
    if (!tripName) {
      return res.status(400).json({
        success: false,
        error: 'Trip name is required'
      });
    }
    
    if (!totalBudget || totalBudget <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid total budget is required'
      });
    }
    
    if (!locations || locations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one location is required'
      });
    }
    
    if (!maxCapacity || maxCapacity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid maximum capacity is required'
      });
    }
    
    // Create new trip object
    const newTrip = {
      id: Date.now(), // Temporary ID for development
      tripName,
      totalBudget: parseFloat(totalBudget),
      locations: Array.isArray(locations) ? locations : [locations],
      departureDateTime: departureDateTime || null,
      transportMedium: transportMedium || 'Not specified',
      departureLocation: departureLocation || 'Not specified',
      arrivalDateTime: arrivalDateTime || null,
      arrivalLocation: arrivalLocation || 'Not specified',
      description: description || '',
      inclusions: inclusions || '',
      exclusions: exclusions || '',
      maxCapacity: parseInt(maxCapacity),
      currentBookings: 0,
      status: 'active',
      adminId: 'temp-admin-id', // TODO: Get from Clerk authentication
      agencyName: 'Escape Travel Agency', // TODO: Get from admin metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('✅ Trip created successfully:', {
      id: newTrip.id,
      name: newTrip.tripName,
      budget: newTrip.totalBudget,
      locations: newTrip.locations,
      capacity: newTrip.maxCapacity
    });
    
    // Send success response
    res.status(201).json({
      success: true,
      trip: newTrip,
      message: `Trip "${tripName}" created successfully!`
    });
    
  } catch (error) {
    console.error('❌ Error creating trip:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while creating trip'
    });
  }
});

// Get all trips for admin (GET /api/admin/trips)
router.get('/trips', async (req, res) => {
  console.log('🎯 GET /api/admin/trips route hit');
  console.log('🌐 Request origin:', req.headers.origin);
  
  try {
    // TODO: Replace with actual database query
    // For now, return sample data
    const trips = [
      {
        id: 1,
        tripName: "Golden Triangle Tour",
        totalBudget: 45000,
        locations: ["Delhi", "Agra", "Jaipur"],
        departureDateTime: "2025-09-15T08:00:00",
        transportMedium: "car",
        departureLocation: "Delhi Airport",
        arrivalDateTime: "2025-09-20T18:00:00",
        arrivalLocation: "Delhi Airport",
        description: "Experience the best of North India with visits to iconic monuments",
        inclusions: "Accommodation, meals, transportation, guide",
        exclusions: "Personal expenses, tips",
        maxCapacity: 25,
        currentBookings: 12,
        status: "active",
        adminId: "temp-admin-id",
        agencyName: "Escape Travel Agency",
        createdAt: "2025-08-20T10:00:00.000Z",
        updatedAt: "2025-08-20T10:00:00.000Z"
      },
      {
        id: 2,
        tripName: "Kerala Backwaters",
        totalBudget: 35000,
        locations: ["Kochi", "Alleppey", "Munnar"],
        departureDateTime: "2025-10-01T09:00:00",
        transportMedium: "mixed",
        departureLocation: "Kochi Airport",
        arrivalDateTime: "2025-10-06T16:00:00",
        arrivalLocation: "Kochi Airport",
        description: "Explore the serene backwaters and hill stations of Kerala",
        inclusions: "Houseboat stay, hill resort, meals, transfers",
        exclusions: "Airfare, personal expenses",
        maxCapacity: 20,
        currentBookings: 8,
        status: "active",
        adminId: "temp-admin-id",
        agencyName: "Escape Travel Agency",
        createdAt: "2025-08-21T14:30:00.000Z",
        updatedAt: "2025-08-21T14:30:00.000Z"
      }
    ];
    
    console.log(`✅ Returning ${trips.length} trips for admin`);
    
    res.json({
      success: true,
      trips: trips,
      total: trips.length,
      message: 'Trips retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching trips:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while fetching trips'
    });
  }
});

// Get single trip by ID (GET /api/admin/trips/:id)
router.get('/trips/:id', async (req, res) => {
  console.log(`🎯 GET /api/admin/trips/${req.params.id} route hit`);
  
  try {
    const tripId = parseInt(req.params.id);
    
    if (!tripId || isNaN(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID'
      });
    }
    
    // TODO: Replace with actual database query
    // For now, return sample data
    const trip = {
      id: tripId,
      tripName: "Sample Trip",
      totalBudget: 30000,
      locations: ["Mumbai", "Goa"],
      departureDateTime: "2025-09-10T10:00:00",
      transportMedium: "flight",
      departureLocation: "Mumbai",
      arrivalDateTime: "2025-09-15T20:00:00",
      arrivalLocation: "Mumbai",
      description: "A wonderful coastal trip",
      inclusions: "Hotel, meals, sightseeing",
      exclusions: "Personal expenses",
      maxCapacity: 15,
      currentBookings: 5,
      status: "active",
      adminId: "temp-admin-id",
      agencyName: "Escape Travel Agency",
      createdAt: "2025-08-22T12:00:00.000Z",
      updatedAt: "2025-08-22T12:00:00.000Z"
    };
    
    console.log(`✅ Trip found: ${trip.tripName}`);
    
    res.json({
      success: true,
      trip: trip,
      message: 'Trip retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching trip:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while fetching trip'
    });
  }
});

// Update trip (PUT /api/admin/trips/:id)
router.put('/trips/:id', async (req, res) => {
  console.log(`🎯 PUT /api/admin/trips/${req.params.id} route hit`);
  console.log('📦 Update data:', req.body);
  
  try {
    const tripId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (!tripId || isNaN(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID'
      });
    }
    
    // TODO: Replace with actual database update
    const updatedTrip = {
      id: tripId,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    console.log(`✅ Trip ${tripId} updated successfully`);
    
    res.json({
      success: true,
      trip: updatedTrip,
      message: 'Trip updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating trip:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while updating trip'
    });
  }
});

// Delete trip (DELETE /api/admin/trips/:id)
router.delete('/trips/:id', async (req, res) => {
  console.log(`🎯 DELETE /api/admin/trips/${req.params.id} route hit`);
  
  try {
    const tripId = parseInt(req.params.id);
    
    if (!tripId || isNaN(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID'
      });
    }
    
    // TODO: Replace with actual database deletion
    // Check if trip has bookings before deletion
    
    console.log(`✅ Trip ${tripId} deleted successfully`);
    
    res.json({
      success: true,
      message: `Trip ${tripId} deleted successfully`
    });
    
  } catch (error) {
    console.error('❌ Error deleting trip:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while deleting trip'
    });
  }
});

// Get admin dashboard stats (GET /api/admin/stats)
router.get('/stats', async (req, res) => {
  console.log('🎯 GET /api/admin/stats route hit');
  
  try {
    // TODO: Replace with actual database queries
    const stats = {
      totalTrips: 15,
      activeTrips: 12,
      totalBookings: 147,
      pendingBookings: 8,
      totalRevenue: 2456780,
      thisMonthRevenue: 145600,
      totalCustomers: 89,
      activeCustomers: 67,
      averageRating: 4.6,
      topDestinations: [
        { name: "Goa", bookings: 23 },
        { name: "Rajasthan", bookings: 19 },
        { name: "Kerala", bookings: 15 },
        { name: "Himachal Pradesh", bookings: 12 },
        { name: "Kashmir", bookings: 8 }
      ]
    };
    
    console.log('✅ Admin stats retrieved successfully');
    
    res.json({
      success: true,
      stats: stats,
      message: 'Dashboard stats retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while fetching stats'
    });
  }
});

// Test admin endpoint (GET /api/admin/test)
router.get('/test', (req, res) => {
  console.log('🎯 GET /api/admin/test route hit');
  
  res.json({
    success: true,
    message: 'Admin routes are working!',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /api/admin/test',
      'GET /api/admin/trips',
      'POST /api/admin/trips',
      'GET /api/admin/trips/:id',
      'PUT /api/admin/trips/:id',
      'DELETE /api/admin/trips/:id',
      'GET /api/admin/stats'
    ]
  });
});

console.log('✅ Admin routes configured:', [
  'GET /test',
  'GET /trips',
  'POST /trips',
  'GET /trips/:id',
  'PUT /trips/:id',
  'DELETE /trips/:id',
  'GET /stats'
]);

module.exports = router;
