const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip.js');
const BargainRequest = require('../models/BargainRequest.js');
const Agency = require('../models/Agency.js');
const Booking = require('../models/Booking.js')

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
router.post('/book-trip', async (req, res) => {
  try {
    const {
      tripId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests
    } = req.body;

    console.log('📝 Processing trip booking:', { tripId, customerName, customerEmail });

    // Find the trip and get its OTP
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    // Check if trip has available spots
    const currentBookings = await Booking.countDocuments({ 
      tripId: tripId,
      bookingStatus: { $ne: 'cancelled' }
    });

    if (currentBookings >= trip.maxCapacity) {
      return res.status(400).json({
        success: false,
        error: 'Trip is fully booked'
      });
    }

    // Create booking
    const booking = new Booking({
      tripId,
      tripOTP: trip.tripOTP, // Use the trip's OTP
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      adminId: trip.adminId,
      agencyName: trip.agencyName,
      totalAmount: trip.totalBudget,
      specialRequests: specialRequests || '',
      bookingStatus: 'confirmed'
    });

    await booking.save();

    // Update trip's current bookings count
    await Trip.findByIdAndUpdate(tripId, {
      $inc: { currentBookings: 1 }
    });

    console.log('✅ Booking created successfully');

    res.json({
      success: true,
      message: 'Trip booked successfully!',
      booking: {
        bookingId: booking._id,
        tripName: trip.tripName,
        tripOTP: trip.tripOTP,
        bookingDate: booking.bookingDate,
        totalAmount: booking.totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Error booking trip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to book trip'
    });
  }
});

// Get bookings for an admin
router.get('/admin/bookings/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    
    console.log('📋 Fetching bookings for admin:', adminId);

    const bookings = await Booking.find({ adminId })
      .populate('tripId', 'tripName locations departureDateTime totalBudget tripOTP')
      .sort({ createdAt: -1 });

    console.log('✅ Found', bookings.length, 'bookings for admin');

    res.json({
      success: true,
      bookings: bookings.map(booking => ({
        _id: booking._id,
        tripName: booking.tripId?.tripName || 'Unknown Trip',
        tripOTP: booking.tripOTP,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        bookingDate: booking.bookingDate,
        bookingStatus: booking.bookingStatus,
        totalAmount: booking.totalAmount,
        specialRequests: booking.specialRequests
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching admin bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

// Get booking statistics for admin dashboard
router.get('/admin/booking-stats/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;

    const totalBookings = await Booking.countDocuments({ adminId });
    const confirmedBookings = await Booking.countDocuments({ 
      adminId, 
      bookingStatus: 'confirmed' 
    });
    const recentBookings = await Booking.find({ adminId })
      .populate('tripId', 'tripName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate total revenue
    const revenueData = await Booking.aggregate([
      { $match: { adminId, bookingStatus: 'confirmed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.json({
      success: true,
      stats: {
        totalBookings,
        confirmedBookings,
        totalRevenue,
        recentBookings: recentBookings.map(booking => ({
          customerName: booking.customerName,
          tripName: booking.tripId?.tripName || 'Unknown',
          tripOTP: booking.tripOTP,
          bookingDate: booking.bookingDate,
          amount: booking.totalAmount
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking statistics'
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
// Add this route BEFORE your existing /admin/trips route
router.get('/admin/trips/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    console.log('🎯 GET /api/trips/admin/trips/:adminId route hit for admin:', adminId);
    
    // Find trips where adminId matches the requesting admin
    const trips = await Trip.find({ 
      $or: [
        { adminId: adminId },
        { agencyId: adminId },
        { ownerId: adminId }
      ]
    }).sort({ createdAt: -1 });

    console.log('✅ Found', trips.length, 'trips for admin:', adminId);

    // Debug logging
    if (trips.length === 0) {
      console.log('🔍 No trips found, checking what exists in database...');
      const allTrips = await Trip.find({}).select('tripName adminId agencyId ownerId');
      console.log('📊 All trips in database:', allTrips.map(t => ({
        name: t.tripName,
        adminId: t.adminId,
        agencyId: t.agencyId,
        ownerId: t.ownerId
      })));
    }

    res.json({
      success: true,
      trips: trips,
      total: trips.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching admin-specific trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trips',
      message: error.message
    });
  }
});

// Add debug route to see what's happening
router.get('/debug/admin-trips/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    console.log('🔍 Debug: Looking for trips with adminId:', adminId);
    
    const allTrips = await Trip.find({});
    console.log('📊 All trips in database:', allTrips.length);
    
    const adminTrips = allTrips.filter(trip => 
      trip.adminId === adminId || 
      trip.agencyId === adminId || 
      trip.ownerId === adminId
    );
    
    console.log('🎯 Trips for admin:', adminTrips.length);
    
    res.json({
      success: true,
      debug: {
        searchingForAdminId: adminId,
        totalTripsInDatabase: allTrips.length,
        tripsForAdmin: adminTrips.length,
        allTripsDetails: allTrips.map(trip => ({
          tripName: trip.tripName,
          adminId: trip.adminId,
          agencyId: trip.agencyId,
          ownerId: trip.ownerId,
          createdBy: trip.createdBy
        })),
        adminTripsDetails: adminTrips.map(trip => ({
          tripName: trip.tripName,
          adminId: trip.adminId,
          matchField: trip.adminId === adminId ? 'adminId' : 
                      trip.agencyId === adminId ? 'agencyId' : 'ownerId'
        }))
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

    const searchRegex = new RegExp(query, 'i');
    
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

// Get all agencies for dropdown
router.get('/agencies', async (req, res) => {
  try {
    console.log('📡 Fetching agencies for dropdown...');
    
    const agencies = await Agency.find({ status: 'active' }).select('_id name ownerName');
    
    console.log('✅ Found', agencies.length, 'agencies');
    console.log('Sample agency:', agencies[0]);
    
    res.json({
      success: true,
      agencies: agencies.map(agency => ({
        id: agency._id,
        name: agency.name || agency.ownerName
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

// Submit bargain request - UPDATED to include customer data properly
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
      taggedTrip,
      customerId,
      customerName,
      customerEmail
    } = req.body;
    
    // Validate required fields
    if (!phoneNumber || !taggedTrip || !selectedAgencies || selectedAgencies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Phone number, tagged trip, and at least one agency are required'
      });
    }

    const agencyName = selectedAgencies[0];
    
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

    // Create bargain request with proper customer data
    const request = new BargainRequest({
      budget: parseFloat(budget),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      destination,
      phoneNumber,
      tripId: taggedTrip,
      agencyId: agency._id,
      customerId: customerId || 'guest-' + Date.now(),
      customerName: customerName || 'Guest Customer',
      customerEmail: customerEmail || 'guest@example.com',
      userName: customerName || 'Guest Customer',
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
      error: 'Failed to submit bargain request'
    });
  }
});

// Customer bargain request submission (separate from general bargain)
router.post('/customer-bargain', async (req, res) => {
  try {
    console.log('📨 Customer bargain request received:', req.body);
    
    const { 
      budget, 
      startDate, 
      endDate, 
      destination, 
      selectedAgencies, 
      phoneNumber, 
      taggedTrip,
      customerId,
      customerName,
      customerEmail
    } = req.body;
    
    // Validate required fields
    if (!phoneNumber || !taggedTrip || !selectedAgencies || !customerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const agencyName = selectedAgencies[0];
    
    // Find agency by name
    const agency = await Agency.findOne({ name: agencyName });
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Selected agency not found'
      });
    }

    // Find the trip
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
      customerId,
      customerName: customerName || 'Customer',
      customerEmail: customerEmail || '',
      userName: customerName || 'Customer',
      status: 'pending',
      createdAt: new Date()
    });
    
    await request.save();
    console.log('✅ Customer bargain request created');
    
    res.json({
      success: true,
      message: 'Bargain request submitted successfully',
      requestId: request._id
    });
  } catch (error) {
    console.error('❌ Error submitting customer bargain request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get customer's bargain requests
router.get('/customer-bargains/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    console.log('📋 Fetching bargain requests for customer:', customerId);
    
    const requests = await BargainRequest.find({ customerId })
      .populate('tripId', 'tripName locations totalBudget')
      .sort({ createdAt: -1 });
    
    console.log('✅ Found', requests.length, 'bargain requests for customer');
    
    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('❌ Error fetching customer bargains:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel customer bargain request
router.delete('/cancel-bargain/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { customerId } = req.body;
    
    console.log('🗑️ Cancelling bargain request:', requestId, 'for customer:', customerId);
    
    const deletedRequest = await BargainRequest.findOneAndDelete({
      _id: requestId,
      customerId: customerId
    });
    
    if (!deletedRequest) {
      return res.status(404).json({
        success: false,
        error: 'Bargain request not found or you do not have permission to cancel it'
      });
    }
    
    console.log('✅ Bargain request cancelled successfully');
    
    res.json({
      success: true,
      message: 'Bargain request cancelled successfully'
    });
  } catch (error) {
    console.error('❌ Error cancelling bargain request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update bargain request status (for admin)
router.put('/bargain-status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminId } = req.body;
    
    console.log('🔄 Updating bargain request status:', requestId, 'to', status);
    
    if (!['pending', 'waiting_list', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    const request = await BargainRequest.findById(requestId).populate('agencyId');
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Bargain request not found'
      });
    }
    
    const agency = await Agency.findOne({ _id: request.agencyId, ownerId: adminId });
    if (!agency) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this request'
      });
    }
    
    request.status = status;
    request.updatedAt = new Date();
    await request.save();
    
    console.log('✅ Bargain request status updated');
    
    res.json({
      success: true,
      message: 'Request status updated successfully',
      request
    });
  } catch (error) {
    console.error('❌ Error updating bargain status:', error);
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
    
    const agency = await Agency.findOne({ ownerId: ownerId });
    
    if (!agency) {
      return res.json({
        success: true,
        requests: [],
        message: 'No agency found for this owner'
      });
    }
    
    const requests = await BargainRequest.find({ agencyId: agency._id })
      .populate('tripId', 'tripName locations totalBudget')
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

// FIXED: Fix customer IDs route - Updated to handle anonymous requests properly
router.post('/fix-customer-ids', async (req, res) => {
  try {
    const { currentUserId, userEmail } = req.body;
    
    console.log('🔧 Fixing customer IDs for user:', currentUserId);
    console.log('🔧 Updating anonymous requests...');
    
    // Update ALL requests with "anonymous" customer ID
    const result = await BargainRequest.updateMany(
      { customerId: "anonymous" },
      {
        $set: {
          customerId: currentUserId,
          customerEmail: userEmail || 'aadiritchcrew@gmail.com',
          customerName: 'Customer',
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} requests from anonymous to ${currentUserId}`);
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} requests to use your user ID`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error fixing customer IDs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Agency management routes
router.post('/create-agency', async (req, res) => {
  try {
    console.log('🏢 Creating new agency:', req.body);
    
    const { name, ownerId, ownerName, contactEmail, contactPhone, gstNumber, description, status } = req.body;
    
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

// Fix agency names in existing trips
router.post('/fix-trip-agency-names', async (req, res) => {
  try {
    const { adminId } = req.body;
    console.log('🔧 Fixing trip agency names for admin:', adminId);
    
    const agency = await Agency.findOne({ ownerId: adminId });
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'No agency found for this admin'
      });
    }
    
    console.log('🏢 Found agency:', agency.name);
    
    const result = await Trip.updateMany(
      { adminId: adminId },
      { 
        $set: { 
          agencyName: agency.name,
          agencyId: adminId,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} trips with correct agency name`);
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} trips to use agency name: ${agency.name}`,
      modifiedCount: result.modifiedCount,
      agencyName: agency.name
    });
    
  } catch (error) {
    console.error('❌ Error fixing trip agency names:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DEBUG: Check what bargain requests exist
router.get('/debug-bargain-requests', async (req, res) => {
  try {
    const allRequests = await BargainRequest.find({}).populate('tripId', 'tripName');
    
    console.log('🔍 All bargain requests in database:');
    allRequests.forEach((req, index) => {
      console.log(`${index + 1}. Customer ID: "${req.customerId}"`);
      console.log(`   Customer Name: "${req.customerName}"`);
      console.log(`   Trip: ${req.tripId?.tripName || 'Unknown'}`);
      console.log(`   Status: ${req.status}`);
      console.log('   ---');
    });
    
    res.json({
      success: true,
      totalRequests: allRequests.length,
      requests: allRequests.map(req => ({
        _id: req._id,
        customerId: req.customerId,
        customerName: req.customerName,
        customerEmail: req.customerEmail,
        tripName: req.tripId?.tripName,
        status: req.status,
        createdAt: req.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// TEMPORARY: Reset bargain requests collection
router.delete('/reset-bargain-requests', async (req, res) => {
  try {
    await BargainRequest.collection.drop();
    console.log('✅ Dropped BargainRequest collection');
    
    res.json({
      success: true,
      message: 'BargainRequest collection reset - new schema will be used'
    });
  } catch (error) {
    console.error('Error resetting collection:', error);
    res.json({
      success: true,
      message: 'Collection may not exist yet, ready for new schema'
    });
  }
});

module.exports = router;
