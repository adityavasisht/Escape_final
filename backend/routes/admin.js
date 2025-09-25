const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { body, validationResult, param } = require('express-validator');
const Trip = require('../models/Trip');
const Agency = require('../models/Agency');
const Booking = require('../models/Booking');
const BargainRequest = require('../models/BargainRequest'); // Add this for bargain requests
const mongoose = require('mongoose');

// IMPORT THE AUTH MIDDLEWARE
const { requireAuth, requireAdmin, validateUserOwnership, requireAuthAndOwnership } = require('../middleware/auth');

console.log('📁 Admin routes module loaded with complete security');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Input validation middleware
const validateAgency = [
  body('name').trim().notEmpty().withMessage('Agency name is required'),
  body('ownerName').trim().notEmpty().withMessage('Owner name is required'),
  body('ownerEmail').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/).withMessage('Valid phone number is required')
];

const validateUserId = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .matches(/^user_[a-zA-Z0-9_]+$/)
    .withMessage('Invalid Clerk user ID format')
];

const validateAdminId = [
  param('adminId')
    .notEmpty()
    .withMessage('Admin ID is required')
    .matches(/^user_[a-zA-Z0-9_]+$/)
    .withMessage('Invalid Clerk user ID format')
];

// Helper function to clean up Cloudinary images
const deleteCloudinaryImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`❌ Failed to delete image ${publicId}:`, error);
  }
};

// Create agency endpoint - SECURE
router.post('/create-agency', requireAuth, validateAgency, async (req, res) => {
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

    console.log('🏢 Creating new agency...');
    console.log('Request body:', req.body);
    
    const {
      name,
      ownerId,
      ownerName,
      ownerEmail,
      phone,
      gstNumber,
      address,
      city,
      state,
      pincode,
      description,
      status = 'active'
    } = req.body;

    const authenticatedUserId = req.auth.userId;
    
    // SECURITY: Ensure user can only create agency for themselves
    if (ownerId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only create an agency for yourself'
      });
    }

    // Validate required fields (matching your schema)
    if (!name || !ownerId || !ownerName || !ownerEmail || !phone) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided: name, ownerId, ownerName, ownerEmail, phone'
      });
    }

    // Check if agency with same GST number already exists (if GST provided)
    if (gstNumber && gstNumber.trim()) {
      const existingAgency = await Agency.findOne({ gstNumber: gstNumber.trim().toUpperCase() });
      if (existingAgency) {
        return res.status(400).json({
          success: false,
          error: 'An agency with this GST number already exists'
        });
      }
    }

    // Check if owner already has an agency
    const existingOwner = await Agency.findOne({ ownerId });
    if (existingOwner) {
      return res.status(400).json({
        success: false,
        error: 'This user already has an agency registered'
      });
    }

    const newAgency = new Agency({
      name: name.trim(),
      ownerId: ownerId.trim(),
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim(),
      phone: phone.trim(),
      gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : '',
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      state: state ? state.trim() : '',
      pincode: pincode ? pincode.trim() : '',
      userType: 'admin',
      status,
      createdAt: new Date()
    });

    const savedAgency = await newAgency.save();
    console.log('✅ Agency created successfully:', savedAgency.name);

    res.status(201).json({
      success: true,
      message: 'Agency created successfully',
      agency: savedAgency
    });

  } catch (error) {
    console.error('❌ Error creating agency:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `This ${field} is already registered with another agency`
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create agency',
      message: error.message
    });
  }
});

// Get agency profile - SECURE
router.get('/profile/:ownerId', requireAuthAndOwnership, async (req, res) => {
  try {
    console.log('📋 Fetching profile for owner ID:', req.params.ownerId);
    const agency = await Agency.findOne({ ownerId: req.params.ownerId });
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Agency profile not found'
      });
    }

    console.log('✅ Found agency profile:', agency.name);
    res.json({
      success: true,
      agency: agency
    });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// Update agency profile - SECURE
router.put('/profile/:ownerId', requireAuthAndOwnership, async (req, res) => {
  try {
    console.log('✏️ Updating profile for owner ID:', req.params.ownerId);
    console.log('Update data:', req.body);

    const { name, ownerEmail, phone, gstNumber, description, address, city, state, pincode } = req.body;

    // Validate required fields (matching schema)
    if (!name || !ownerEmail || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and phone are required'
      });
    }

    // Check if another agency has the same GST number (excluding current agency)
    if (gstNumber && gstNumber.trim()) {
      const existingAgency = await Agency.findOne({ 
        gstNumber: gstNumber.toUpperCase(),
        ownerId: { $ne: req.params.ownerId }
      });
      if (existingAgency) {
        return res.status(400).json({
          success: false,
          error: 'Another agency is already registered with this GST number'
        });
      }
    }

    const updatedAgency = await Agency.findOneAndUpdate(
      { ownerId: req.params.ownerId },
      {
        name: name.trim(),
        ownerEmail: ownerEmail.trim(),
        phone: phone.trim(),
        gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : '',
        description: description ? description.trim() : '',
        address: address ? address.trim() : '',
        city: city ? city.trim() : '',
        state: state ? state.trim() : '',
        pincode: pincode ? pincode.trim() : '',
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedAgency) {
      return res.status(404).json({
        success: false,
        error: 'Agency not found'
      });
    }

    console.log('✅ Profile updated successfully');
    res.json({
      success: true,
      message: 'Profile updated successfully',
      agency: updatedAgency
    });

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.message
      });
    }
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `This ${field} is already registered with another agency`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// TRIP CREATION - SECURE
router.post('/trips', requireAuth, upload.array('itineraryImages', 10), async (req, res) => {
  console.log('🎯 Creating trip with OTP handling');
  console.log('📦 Request body:', req.body);
  console.log('📸 Files uploaded:', req.files?.length || 0);
  
  try {
    const authenticatedUserId = req.auth.userId;
    
    const imageUrls = [];
    
    // Upload images to Cloudinary if files are provided
    if (req.files && req.files.length > 0) {
      console.log(`🔄 Uploading ${req.files.length} itinerary images to Cloudinary...`);
      
      for (const file of req.files) {
        try {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { 
                folder: 'escape-itineraries',
                transformation: [
                  { width: 800, height: 600, crop: 'fill', quality: 'auto' }
                ]
              },
              (error, result) => {
                if (error) {
                  console.error('Cloudinary upload error:', error);
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            ).end(file.buffer);
          });
          
          imageUrls.push({
            url: result.secure_url,
            publicId: result.public_id,
            originalName: file.originalname
          });
          
          console.log(`✅ Image uploaded: ${file.originalname}`);
        } catch (uploadError) {
          console.error(`❌ Failed to upload ${file.originalname}:`, uploadError);
        }
      }
    }
    
    // Parse locations if it's a JSON string (from FormData)
    let locations;
    try {
      locations = typeof req.body.locations === 'string' 
        ? JSON.parse(req.body.locations) 
        : req.body.locations;
    } catch (parseError) {
      console.error('Error parsing locations:', parseError);
      locations = Array.isArray(req.body.locations) ? req.body.locations : [req.body.locations];
    }
    
    const {
      tripName,
      totalBudget,
      departureDateTime,
      transportMedium,
      departureLocation,
      arrivalDateTime,
      arrivalLocation,
      description,
      inclusions,
      exclusions,
      maxCapacity,
      adminId,
      tripOTP
    } = req.body;
    
    // SECURITY: Ensure admin can only create trips for themselves
    if (adminId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only create trips for your own agency'
      });
    }
    
    // STRICT VALIDATION for admin ID
    if (!adminId || typeof adminId !== 'string' || adminId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Valid admin ID is required for trip creation'
      });
    }

    // ✅ VALIDATE OTP
    if (!tripOTP || typeof tripOTP !== 'string' || tripOTP.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Trip OTP is required for trip creation'
      });
    }

    // Check if OTP already exists (ensure uniqueness)
    const existingTripWithOTP = await Trip.findOne({ tripOTP: tripOTP.trim() });
    if (existingTripWithOTP) {
      // Generate a new unique OTP if conflict
      let uniqueOTP;
      let attempts = 0;
      
      do {
        uniqueOTP = Math.floor(1000 + Math.random() * 9000).toString();
        const existing = await Trip.findOne({ tripOTP: uniqueOTP });
        attempts++;
        
        if (!existing) {
          console.log(`✅ Generated unique OTP: ${uniqueOTP} (attempt ${attempts})`);
          break;
        }
      } while (attempts < 50);
      
      if (attempts >= 50) {
        return res.status(500).json({
          success: false,
          error: 'Unable to generate unique OTP. Please try again.'
        });
      }
      
      req.body.tripOTP = uniqueOTP; // Update the OTP
    }

    // Validate other required fields
    if (!tripName || !totalBudget || !locations || !maxCapacity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tripName, totalBudget, locations, maxCapacity'
      });
    }

    const cleanAdminId = adminId.trim();
    const cleanTripOTP = (req.body.tripOTP || tripOTP).trim();
    
    console.log('✅ Creating trip for admin:', cleanAdminId);
    console.log('✅ Trip OTP:', cleanTripOTP);

    // Get agency name (optional - for display purposes)
    let agencyName = 'Travel Agency';
    try {
      const agency = await Agency.findOne({ ownerId: cleanAdminId });
      if (agency) {
        agencyName = agency.name;
        console.log('✅ Found agency:', agencyName);
      }
    } catch (agencyError) {
      console.log('⚠️ Could not fetch agency info, using default name');
    }
    
    console.log('💾 Creating trip with:');
    console.log('- adminId:', cleanAdminId);
    console.log('- tripOTP:', cleanTripOTP);
    console.log('- agencyName:', agencyName);
    
    // ✅ CREATE TRIP WITH OTP
    const newTrip = new Trip({
      tripName: tripName.toString().trim(),
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
      adminId: cleanAdminId,
      agencyId: cleanAdminId,
      agencyName: agencyName,
      tripOTP: cleanTripOTP,
      itineraryImages: imageUrls,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedTrip = await newTrip.save();
    console.log('✅ Trip SAVED successfully:', savedTrip._id);
    console.log('✅ Trip OTP confirmed:', savedTrip.tripOTP);
    
    res.status(201).json({
      success: true,
      trip: savedTrip,
      message: `Trip "${tripName}" created successfully with OTP: ${cleanTripOTP}`,
      adminId: cleanAdminId,
      tripOTP: savedTrip.tripOTP,
      imageCount: imageUrls.length
    });
    
  } catch (error) {
    console.error('❌ Trip creation error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      console.error('❌ Validation error details:', error.errors);
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${error.message}`,
        details: error.errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Duplicate ${field}: This ${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while creating trip'
    });
  }
});

// Get all trips for admin - SECURE
router.get('/trips', requireAuth, async (req, res) => {
  console.log('🎯 GET /api/admin/trips route hit');
  
  try {
    const authenticatedUserId = req.auth.userId;
    const { status, page = 1, limit = 50 } = req.query;
    
    console.log('📊 Fetching trips for authenticated admin:', authenticatedUserId);
    
    // SECURITY: Admin can only see their own trips
    const filter = { adminId: authenticatedUserId };
    if (status) filter.status = status;
    
    console.log('🔒 STRICT FILTER: Only showing trips for admin:', authenticatedUserId);
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalTrips = await Trip.countDocuments(filter);
    
    console.log(`✅ Found ${trips.length} trips for admin (${totalTrips} total matching filter)`);
    
    res.json({
      success: true,
      trips: trips,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalTrips / parseInt(limit)),
        count: trips.length,
        totalRecords: totalTrips
      },
      filter: filter,
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

// Get single trip by ID - SECURE
router.get('/trips/:id', requireAuth, async (req, res) => {
  console.log(`🎯 GET /api/admin/trips/${req.params.id} route hit`);
  
  try {
    const tripId = req.params.id;
    const authenticatedUserId = req.auth.userId;
    
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID format'
      });
    }
    
    // SECURITY: Admin can only access their own trips
    const trip = await Trip.findOne({ 
      _id: tripId,
      adminId: authenticatedUserId 
    });
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found or you do not have permission to access it'
      });
    }
    
    console.log(`✅ Trip found: ${trip.tripName} (Admin: ${trip.adminId}, OTP: ${trip.tripOTP})`);
    
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

// Update trip - SECURE
router.put('/trips/:id', requireAuth, upload.array('itineraryImages', 10), async (req, res) => {
  console.log(`🎯 PUT /api/admin/trips/${req.params.id} route hit`);
  console.log('📦 Update data:', req.body);
  console.log('📸 Files uploaded:', req.files?.length || 0);
  
  try {
    const tripId = req.params.id;
    const authenticatedUserId = req.auth.userId;
    
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID format'
      });
    }
    
    // SECURITY: Find existing trip and verify ownership
    const existingTrip = await Trip.findOne({
      _id: tripId,
      adminId: authenticatedUserId
    });
    
    if (!existingTrip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found or you do not have permission to update it'
      });
    }
    
    // Handle image uploads (existing code)
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      console.log(`🔄 Uploading ${req.files.length} new images to Cloudinary...`);
      
      for (const file of req.files) {
        try {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { 
                folder: 'escape-itineraries',
                transformation: [{ width: 800, height: 600, crop: 'fill', quality: 'auto' }]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(file.buffer);
          });
          
          imageUrls.push({
            url: result.secure_url,
            publicId: result.public_id,
            originalName: file.originalname
          });
        } catch (uploadError) {
          console.error(`❌ Failed to upload ${file.originalname}:`, uploadError);
        }
      }
    }
    
    // Parse locations
    let locations;
    try {
      locations = typeof req.body.locations === 'string' 
        ? JSON.parse(req.body.locations) 
        : req.body.locations;
    } catch (parseError) {
      locations = Array.isArray(req.body.locations) ? req.body.locations : [req.body.locations];
    }
    
    // Prepare update data
    const updateData = {
      tripName: req.body.tripName,
      totalBudget: parseFloat(req.body.totalBudget),
      locations: locations,
      departureDateTime: req.body.departureDateTime,
      transportMedium: req.body.transportMedium,
      departureLocation: req.body.departureLocation,
      arrivalDateTime: req.body.arrivalDateTime,
      arrivalLocation: req.body.arrivalLocation,
      description: req.body.description || '',
      inclusions: req.body.inclusions || '',
      exclusions: req.body.exclusions || '',
      maxCapacity: parseInt(req.body.maxCapacity),
      updatedAt: new Date()
    };
    
    // Handle image replacement
    if (imageUrls.length > 0) {
      if (req.body.replaceImages === 'true' && existingTrip.itineraryImages) {
        console.log('🗑️ Deleting old images from Cloudinary...');
        for (const oldImage of existingTrip.itineraryImages) {
          if (oldImage.publicId) {
            await deleteCloudinaryImage(oldImage.publicId);
          }
        }
        updateData.itineraryImages = imageUrls;
      } else {
        updateData.itineraryImages = [...(existingTrip.itineraryImages || []), ...imageUrls];
      }
    }
    
    // UPDATE IN DATABASE
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log(`✅ Trip ${tripId} updated in database`);
    
    res.json({
      success: true,
      trip: updatedTrip,
      message: `Trip "${updatedTrip.tripName}" updated successfully`,
      imageCount: imageUrls.length
    });
    
  } catch (error) {
    console.error('❌ Error updating trip:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while updating trip'
    });
  }
});

// Delete trip - SECURE
router.delete('/trips/:id', requireAuth, async (req, res) => {
  console.log(`🎯 DELETE /api/admin/trips/${req.params.id} route hit`);
  
  try {
    const tripId = req.params.id;
    const authenticatedUserId = req.auth.userId;
    
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID format'
      });
    }
    
    // SECURITY: Find and delete only if it belongs to the authenticated admin
    const tripToDelete = await Trip.findOne({
      _id: tripId,
      adminId: authenticatedUserId
    });
    
    if (!tripToDelete) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found or you do not have permission to delete it'
      });
    }
    
    // Delete the trip
    const deletedTrip = await Trip.findByIdAndDelete(tripId);
    
    // Delete associated images from Cloudinary
    if (deletedTrip.itineraryImages && deletedTrip.itineraryImages.length > 0) {
      console.log('🗑️ Cleaning up images from Cloudinary...');
      for (const image of deletedTrip.itineraryImages) {
        if (image.publicId) {
          await deleteCloudinaryImage(image.publicId);
        }
      }
    }
    
    console.log(`✅ Trip ${tripId} deleted successfully`);
    
    res.json({
      success: true,
      message: `Trip "${deletedTrip.tripName}" deleted successfully`
    });
    
  } catch (error) {
    console.error('❌ Error deleting trip:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while deleting trip'
    });
  }
});

// ENHANCED Dashboard stats - SECURE
router.get('/stats', requireAuth, async (req, res) => {
  console.log('📊 GET /api/admin/stats route hit');
  
  try {
    const authenticatedUserId = req.auth.userId;
    console.log('📊 Fetching stats for authenticated admin:', authenticatedUserId);
    
    // SECURITY: Admin can only see their own stats
    const filter = { adminId: authenticatedUserId };
    console.log('📊 Using strict filter:', filter);
    
    const totalTrips = await Trip.countDocuments(filter);
    const activeTrips = await Trip.countDocuments({ ...filter, status: 'active' });
    const inactiveTrips = await Trip.countDocuments({ ...filter, status: 'inactive' });
    
    // Get trips for this admin only
    const trips = await Trip.find(filter);
    
    // Get bookings for this admin's trips only - SECURE
    const adminBookings = await Booking.find({ adminId: authenticatedUserId });
    const totalBookings = adminBookings.length;
    const confirmedBookings = adminBookings.filter(b => b.bookingStatus === 'confirmed').length;
    const totalRevenue = adminBookings
      .filter(b => b.bookingStatus === 'confirmed')
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    console.log(`📊 Admin ${authenticatedUserId} has ${totalTrips} trips, ${totalBookings} bookings`);
    
    // Get top destinations for this admin
    const destinationCounts = {};
    trips.forEach(trip => {
      trip.locations.forEach(location => {
        destinationCounts[location] = (destinationCounts[location] || 0) + 1;
      });
    });
    
    const topDestinations = Object.entries(destinationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([destination, count]) => ({ destination, count }));
    
    const stats = {
      totalTrips,
      activeTrips,
      inactiveTrips,
      totalBookings,
      confirmedBookings,
      pendingBookings: totalBookings - confirmedBookings,
      totalRevenue,
      thisMonthRevenue: 0, // Could calculate this with date filters
      totalCustomers: [...new Set(adminBookings.map(b => b.customerId))].length,
      activeCustomers: [...new Set(adminBookings.filter(b => b.bookingStatus === 'confirmed').map(b => b.customerId))].length,
      averageRating: 4.6,
      topDestinations,
      averageTripBudget: totalTrips > 0 ? trips.reduce((sum, trip) => sum + trip.totalBudget, 0) / totalTrips : 0,
      totalCapacity: trips.reduce((sum, trip) => sum + trip.maxCapacity, 0),
      utilizationRate: trips.reduce((sum, trip) => sum + trip.maxCapacity, 0) > 0 
        ? (totalBookings / trips.reduce((sum, trip) => sum + trip.maxCapacity, 0) * 100).toFixed(2)
        : 0
    };
    
    console.log('📊 Returning admin-specific stats:', stats);
    
    res.json({
      success: true,
      stats: stats,
      message: 'Dashboard stats retrieved successfully',
      adminId: authenticatedUserId
    });
    
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while fetching stats'
    });
  }
});

// FIXED: Get bookings for admin - Use same auth pattern as /stats route
router.get('/bookings/:adminId', requireAuth, async (req, res) => {
  console.log('📋 Fixed bookings route called');
  console.log('📍 Route:', req.method, req.originalUrl);
  console.log('📝 Request params:', req.params);
  console.log('🔐 Auth object:', req.auth);
  
  try {
    const { adminId } = req.params;
    const authenticatedUserId = req.auth?.userId;
    
    // Security: Admin can only access their own bookings
    if (adminId !== authenticatedUserId) {
      console.log('🚨 SECURITY: Attempted access denied');
      return res.status(403).json({
        success: false,
        error: 'Access denied - you can only view your own bookings'
      });
    }
    
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
        specialRequests: booking.specialRequests,
        totalPassengers: booking.totalPassengers || 1,
        passengers: booking.passengers || []
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

// Get bookings for a specific trip (admin scoped)
router.get('/bookings-by-trip/:adminId/:tripId', requireAuth, async (req, res) => {
  try {
    const { adminId, tripId } = req.params;
    const authenticatedUserId = req.auth?.userId;

    if (adminId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - you can only view your own trip bookings'
      });
    }

    const bookings = await Booking.find({ adminId, tripId })
      .populate('tripId', 'tripName locations')
      .sort({ bookingDate: -1 });

    res.json({
      success: true,
      bookings: bookings.map(b => ({
        _id: b._id,
        tripName: b.tripId?.tripName || 'Unknown Trip',
        tripOTP: b.tripOTP,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        customerPhone: b.customerPhone,
        bookingDate: b.bookingDate,
        bookingStatus: b.bookingStatus,
        totalAmount: b.totalAmount,
        totalPassengers: b.totalPassengers || (b.passengers?.length || 1),
        passengers: b.passengers || []
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching trip bookings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trip bookings' });
  }
});

// FIXED: Get booking statistics for admin dashboard - Use same auth pattern as /stats route
router.get('/booking-stats/:adminId', requireAuth, async (req, res) => {
  try {
    const { adminId } = req.params;
    const authenticatedUserId = req.auth?.userId;
    
    // Security: Admin can only access their own booking stats
    if (adminId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - you can only view your own booking statistics'
      });
    }
    
    console.log('📊 Fetching booking stats for admin:', adminId);
    
    const totalBookings = await Booking.countDocuments({ adminId });
    const confirmedBookings = await Booking.countDocuments({ 
      adminId, 
      bookingStatus: 'confirmed' 
    });
    const recentBookings = await Booking.find({ adminId })
      .populate('tripId', 'tripName')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const revenueData = await Booking.aggregate([
      { $match: { adminId, bookingStatus: 'confirmed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    
    console.log('✅ Booking stats calculated successfully');
    
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




// SECURE: Get bargain requests for admin - CORRECTED ROUTE WITH PARAMETER
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


// SECURE Bulk operations - admin can only update their own trips
router.patch('/trips/bulk-status', requireAuth, async (req, res) => {
  console.log('🎯 BULK status update route hit');
  
  try {
    const { tripIds, status } = req.body;
    const authenticatedUserId = req.auth.userId;
    
    if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Trip IDs array is required'
      });
    }
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be either "active" or "inactive"'
      });
    }
    
    // SECURITY: Admin can only update their own trips
    const filter = { 
      _id: { $in: tripIds },
      adminId: authenticatedUserId // Ensure admin can only update their own trips
    };
    
    const result = await Trip.updateMany(
      filter,
      { 
        status: status,
        updatedAt: new Date()
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} trips to ${status} for admin ${authenticatedUserId}`);
    
    res.json({
      success: true,
      message: `${result.modifiedCount} trips updated to ${status}`,
      modifiedCount: result.modifiedCount
    });
    
  } catch (error) {
    console.error('❌ Error in bulk status update:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Check if user is admin - SECURE
router.get('/check-admin-status/:userId', requireAuthAndOwnership, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 Checking admin status for user:', userId);
    // Find agency owned by this user
    const agency = await Agency.findOne({ 
      ownerId: userId,
      status: 'active' 
    });
    if (agency) {
      console.log('✅ User is admin - owns agency:', agency.name);
      res.json({
        success: true,
        isAdmin: true,
        agency: {
          _id: agency._id,
          name: agency.name,
          ownerName: agency.ownerName,
          ownerEmail: agency.ownerEmail,
          phone: agency.phone,
          gstNumber: agency.gstNumber,
          status: agency.status,
          createdAt: agency.createdAt
        },
        message: 'User has admin privileges'
      });
    } else {
      console.log('❌ User is not admin - no agency found');
      res.json({
        success: true,
        isAdmin: false,
        agency: null,
        message: 'User does not have admin privileges'
      });
    }
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    res.status(500).json({
      success: false,
      isAdmin: false,
      agency: null,
      error: 'Failed to check admin status',
      message: error.message
    });
  }
});
// TEST ROUTES - Add these at the end of your routes/admin.js file, just before module.exports

// TEST ROUTE: Get bookings without middleware


// TEST ROUTE: Get booking stats without middleware




console.log('✅ Admin routes configured with complete security, user isolation, and booking protection');

module.exports = router;
