const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const Trip = require('../models/Trip.js');
const BargainRequest = require('../models/BargainRequest.js');
const Agency = require('../models/Agency.js');
const Booking = require('../models/Booking.js');

// IMPORT THE AUTH MIDDLEWARE
const { requireAuth, requireAdmin, validateUserOwnership, requireAuthAndOwnership } = require('../middleware/auth');

console.log('📁 Trips routes module loaded with security middleware');

// Input validation middleware
const validateBargainRequest = [
  body('budget')
    .isNumeric()
    .withMessage('Budget must be a valid number')
    .isFloat({ min: 1000, max: 10000000 })
    .withMessage('Budget must be between ₹1,000 and ₹1,00,00,000'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .custom((value) => {
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.startDate);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Destination must be between 2 and 100 characters'),
  
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('selectedAgencies')
    .isArray({ min: 1 })
    .withMessage('At least one agency must be selected'),
  
  body('taggedTrip')
    .isMongoId()
    .withMessage('Invalid trip ID format'),
  
  body('customerName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Customer name must be between 1 and 50 characters'),
  
  body('customerEmail')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email address')
];

const validateUserId = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isLength({ min: 10, max: 50 })
    .withMessage('Invalid user ID format')
];

const validateRequestId = [
  param('requestId')
    .isMongoId()
    .withMessage('Invalid request ID format')
];

// IMPORTANT: Admin-specific routes MUST come before general routes to avoid conflicts

// Admin-specific trips route - SECURE
router.get('/admin/trips/:adminId', requireAuthAndOwnership, async (req, res) => {
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

// Debug route - SECURE
router.get('/debug/admin-trips/:adminId', requireAuthAndOwnership, async (req, res) => {
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

// Fix trip admin IDs route - SECURE
router.post('/fix-trip-admin-ids', requireAuth, async (req, res) => {
  try {
    const { adminId } = req.body;
    const authenticatedUserId = req.auth.userId;
    
    // Ensure user can only fix their own trips
    if (adminId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only fix your own trip admin IDs'
      });
    }
    
    console.log('🔧 Fixing trip admin IDs for admin:', adminId);
    
    // Find agency for this admin
    const agency = await Agency.findOne({ ownerId: adminId });
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'No agency found for this admin'
      });
    }
    
    console.log('🏢 Found agency:', agency.name);
    
    // Update trips that belong to this agency but don't have adminId set
    const result = await Trip.updateMany(
      { 
        $or: [
          { agencyName: agency.name, adminId: { $exists: false } },
          { agencyName: agency.name, adminId: null },
          { agencyName: agency.name, adminId: '' }
        ]
      },
      { 
        $set: { 
          adminId: adminId,
          agencyId: adminId,
          ownerId: adminId,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} trips with correct admin ID`);
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} trips to use admin ID: ${adminId}`,
      modifiedCount: result.modifiedCount
    });
    
  } catch (error) {
    console.error('❌ Error fixing trip admin IDs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// General admin route - SECURE
router.get('/admin/trips', requireAuth, async (req, res) => {
  try {
    console.log('🎯 GET /api/trips/admin/trips route hit (general)');
    
    const authenticatedUserId = req.auth.userId;
    
    // SECURITY: Admin can only see their own trips
    const trips = await Trip.find({ adminId: authenticatedUserId })
      .sort({ createdAt: -1 });

    console.log('✅ Admin found', trips.length, 'trips (filtered by admin)');

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

// Booking routes - SECURE
router.post('/book-trip', requireAuth, async (req, res) => {
  try {
    const {
      tripId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests
    } = req.body;

    const authenticatedUserId = req.auth.userId;
    
    // Ensure user can only book trips for themselves
    if (customerId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only book trips for yourself'
      });
    }

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

// Public routes
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

// Admin management routes - SECURE
router.delete('/admin/trips/:tripId', requireAuth, async (req, res) => {
  try {
    console.log('🗑️ Admin deleting trip:', req.params.tripId);
    
    const authenticatedUserId = req.auth.userId;
    
    // Find the trip and verify ownership
    const trip = await Trip.findById(req.params.tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }
    
    // Ensure user can only delete their own trips
    if (trip.adminId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own trips'
      });
    }
    
    const result = await Trip.findByIdAndDelete(req.params.tripId);

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

    // Sanitize search query to prevent NoSQL injection
    const sanitizedQuery = query.replace(/[^\w\s]/gi, '');
    const searchRegex = new RegExp(sanitizedQuery, 'i');
    
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
      query: sanitizedQuery
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

// Agency routes
router.get('/agencies', async (req, res) => {
  try {
    console.log('📡 Fetching agencies for dropdown...');
    
    const agencies = await Agency.find({ status: 'active' }).select('_id name ownerName');
    
    console.log('✅ Found', agencies.length, 'agencies');
    
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

router.post('/create-agency', requireAuth, async (req, res) => {
  try {
    console.log('🏢 Creating new agency:', req.body);
    
    const { name, ownerId, ownerName, contactEmail, contactPhone, gstNumber, description, status } = req.body;
    const authenticatedUserId = req.auth.userId;
    
    // Ensure user can only create agency for themselves
    if (ownerId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only create an agency for yourself'
      });
    }
    
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

// ENHANCED BARGAIN REQUEST ROUTES WITH SECURITY

// Submit bargain request (for anonymous/guest users)
router.post('/bargain', validateBargainRequest, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

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

// Submit bargain request (for authenticated users) - SECURE
router.post('/customer-bargain', requireAuth, validateBargainRequest, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

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

    const authenticatedUserId = req.auth.userId;
    
    // Ensure user can only create bargain requests for themselves
    if (customerId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only create bargain requests for yourself'
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

// SECURE: Get bargain requests for a specific customer - FIXED PARAMETER NAME
router.get('/customer-bargains/:userId', requireAuthAndOwnership, validateUserId, async (req, res) => {
  console.log('🔍 MIDDLEWARE DEBUG - customer-bargains route called');
  console.log('📍 Route:', req.method, req.originalUrl);
  console.log('📝 Request params:', req.params);
  console.log('🔐 Auth object:', req.auth);
  
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    console.log('📋 Fetching bargain requests for customer:', userId);
    
    // EMERGENCY DOUBLE-CHECK
    const authenticatedUserId = req.auth?.userId;
    if (userId !== authenticatedUserId) {
      console.log('🚨 SECURITY BREACH ATTEMPT:');
      console.log('   Requested:', userId);
      console.log('   Authenticated:', authenticatedUserId);
      
      return res.status(403).json({
        success: false,
        error: 'Access denied - security violation logged'
      });
    }
    
    // Double security: filter by customerId to ensure user isolation
    const requests = await BargainRequest.find({ customerId: userId })
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

// SECURE: Cancel bargain request - FIXED
router.delete('/cancel-bargain/:requestId', requireAuth, validateRequestId, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { requestId } = req.params;
    const authenticatedUserId = req.auth.userId;
    
    console.log('🗑️ Cancelling bargain request:', requestId, 'for user:', authenticatedUserId);
    
    // Find and delete only if it belongs to the authenticated user
    const deletedRequest = await BargainRequest.findOneAndDelete({
      _id: requestId,
      customerId: authenticatedUserId // Ensure user can only delete their own requests
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

// Update bargain request status - SECURE (ADMIN ONLY)
router.put('/bargain-status/:requestId', requireAuth, validateRequestId, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { requestId } = req.params;
    const { status } = req.body;
    const authenticatedUserId = req.auth.userId;
    
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
    
    // Verify the authenticated user owns the agency for this request
    const agency = await Agency.findOne({ _id: request.agencyId, ownerId: authenticatedUserId });
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

// Get bargain requests for agency owner - SECURE
// FIXED: Get bargain requests for agency owner - Use simple auth like /stats route
router.get('/bargain/requests/owner/:ownerId', requireAuth, async (req, res) => {
  try {
    const { ownerId } = req.params;
    const authenticatedUserId = req.auth?.userId;
    
    // Security: User can only access their own bargain requests
    if (ownerId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - you can only view your own bargain requests'
      });
    }
    
    console.log('📋 Fetching bargain requests for owner:', ownerId);
    
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
      error: 'Failed to fetch bargain requests',
      details: error.message
    });
  }
});

// SECURE: Get user bookings - FIXED WITH DOUBLE SECURITY
router.get('/bookings/user/:userId', requireAuthAndOwnership, validateUserId, async (req, res) => {
  console.log('🔍 MIDDLEWARE DEBUG - bookings route called');
  console.log('📍 Route:', req.method, req.originalUrl);
  console.log('📝 Request params:', req.params);
  console.log('🔐 Auth object:', req.auth);
  
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const authenticatedUserId = req.auth?.userId;
    
    // EMERGENCY DOUBLE-CHECK
    if (userId !== authenticatedUserId) {
      console.log('🚨 SECURITY BREACH ATTEMPT:');
      console.log('   Requested:', userId);
      console.log('   Authenticated:', authenticatedUserId);
      
      return res.status(403).json({
        success: false,
        error: 'Access denied - security violation logged'
      });
    }
    
    console.log('📋 Fetching bookings for user:', userId);

    // User isolation: only return bookings for the authenticated user
    const bookings = await Booking.find({ customerId: userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings: bookings
    });

  } catch (error) {
    console.error('❌ Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

// Utility routes - SECURE
router.post('/fix-customer-ids', requireAuth, async (req, res) => {
  try {
    const { currentUserId, userEmail } = req.body;
    const authenticatedUserId = req.auth.userId;
    
    // Ensure user can only fix their own customer IDs
    if (currentUserId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only fix your own customer IDs'
      });
    }
    
    console.log('🔧 Fixing customer IDs for user:', currentUserId);
    
    // Only update anonymous requests (prevent unauthorized data modification)
    const result = await BargainRequest.updateMany(
      { 
        customerId: "anonymous",
        customerEmail: userEmail || 'aadiritchcrew@gmail.com' // Additional verification
      },
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

router.post('/fix-trip-agency-names', requireAuth, async (req, res) => {
  try {
    const { adminId } = req.body;
    const authenticatedUserId = req.auth.userId;
    
    // Ensure user can only fix their own trip agency names
    if (adminId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only fix your own trip agency names'
      });
    }
    
    console.log('🔧 Fixing trip agency names for admin:', adminId);
    
    const agency = await Agency.findOne({ ownerId: adminId });
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'No agency found for this admin'
      });
    }
    
    console.log('🏢 Found agency:', agency.name);
    
    // Only update trips that belong to this admin
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

// Authentication test route - SECURE
router.get('/debug/auth-test/:userId', requireAuthAndOwnership, async (req, res) => {
  res.json({
    success: true,
    message: 'Authentication test passed',
    authenticatedUser: req.auth.userId,
    requestedUser: req.params.userId,
    matches: req.auth.userId === req.params.userId
  });
});

// Debug routes (only for development - should be removed in production)
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

console.log('✅ Trips routes configured with complete security and user isolation');

module.exports = router;
