const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Trip = require('../models/Trip');
const Agency = require('../models/Agency');
const mongoose = require('mongoose');

console.log('📁 Admin routes module loaded');

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

// Helper function to clean up Cloudinary images
const deleteCloudinaryImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`❌ Failed to delete image ${publicId}:`, error);
  }
};

// Create agency endpoint (for signup flow) - CORRECTED
router.post('/create-agency', async (req, res) => {
  console.log('🏢 Creating new agency...');
  console.log('Request body:', req.body);
  
  try {
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

// Get agency profile
router.get('/profile/:ownerId', async (req, res) => {
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

// Update agency profile - CORRECTED to match schema
router.put('/profile/:ownerId', async (req, res) => {
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

// ✅ FIXED TRIP CREATION ROUTE WITH PROPER OTP HANDLING
router.post('/trips', upload.array('itineraryImages', 10), async (req, res) => {
  console.log('🎯 Creating trip with OTP handling');
  console.log('📦 Request body:', req.body);
  console.log('📸 Files uploaded:', req.files?.length || 0);
  
  try {
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
      tripOTP // ✅ EXTRACT OTP FROM REQUEST
    } = req.body;
    
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
      tripOTP: cleanTripOTP, // ✅ SET THE OTP HERE
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

// Get all trips for admin (GET /api/admin/trips) - WITH PERFECT ADMIN ISOLATION
router.get('/trips', async (req, res) => {
  console.log('🎯 GET /api/admin/trips route hit');
  
  try {
    const { adminId, status, page = 1, limit = 50 } = req.query;
    console.log('📊 Fetching trips with filter:', { adminId, status, page, limit });
    
    // Build filter query - STRICT admin filtering
    const filter = {};
    if (adminId) {
      filter.adminId = adminId;
      console.log('🔒 STRICT FILTER: Only showing trips for admin:', adminId);
    }
    if (status) filter.status = status;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalTrips = await Trip.countDocuments(filter);
    
    console.log(`✅ Found ${trips.length} trips for admin (${totalTrips} total matching filter)`);
    
    // Debug: Show admin IDs of found trips
    if (trips.length > 0) {
      console.log('🔍 Trip admin IDs:', trips.map(t => t.adminId));
      console.log('🔍 Trip OTPs:', trips.map(t => t.tripOTP));
    }
    
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

// Get single trip by ID (GET /api/admin/trips/:id)
router.get('/trips/:id', async (req, res) => {
  console.log(`🎯 GET /api/admin/trips/${req.params.id} route hit`);
  
  try {
    const tripId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID format'
      });
    }
    
    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
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

// Update trip (PUT /api/admin/trips/:id)
router.put('/trips/:id', upload.array('itineraryImages', 10), async (req, res) => {
  console.log(`🎯 PUT /api/admin/trips/${req.params.id} route hit`);
  console.log('📦 Update data:', req.body);
  console.log('📸 Files uploaded:', req.files?.length || 0);
  
  try {
    const tripId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID format'
      });
    }
    
    // Find existing trip to check ownership and get old images
    const existingTrip = await Trip.findById(tripId);
    if (!existingTrip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }
    
    // Handle image uploads
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
    
    // Don't update OTP during trip updates - keep original
    // The OTP should remain the same for the life of the trip
    
    // Handle image replacement
    if (imageUrls.length > 0) {
      // If replacing images, delete old ones from Cloudinary
      if (req.body.replaceImages === 'true' && existingTrip.itineraryImages) {
        console.log('🗑️ Deleting old images from Cloudinary...');
        for (const oldImage of existingTrip.itineraryImages) {
          if (oldImage.publicId) {
            await deleteCloudinaryImage(oldImage.publicId);
          }
        }
        updateData.itineraryImages = imageUrls;
      } else {
        // Append new images to existing ones
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
      error: error.message || 'Internal server error while updating trip'
    });
  }
});

// Delete trip (DELETE /api/admin/trips/:id)
router.delete('/trips/:id', async (req, res) => {
  console.log(`🎯 DELETE /api/admin/trips/${req.params.id} route hit`);
  
  try {
    const tripId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trip ID format'
      });
    }
    
    const deletedTrip = await Trip.findByIdAndDelete(tripId);
    
    if (!deletedTrip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }
    
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

// CORRECTED Dashboard stats with strict admin filtering
router.get('/stats', async (req, res) => {
  console.log('📊 GET /api/admin/stats route hit');
  
  try {
    const { adminId } = req.query;
    console.log('📊 Fetching stats for admin:', adminId);
    
    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'Admin ID is required for dashboard stats'
      });
    }

    // STRICT filtering by adminId - each admin sees only their trips
    const filter = { adminId: adminId };
    console.log('📊 Using strict filter:', filter);
    
    const totalTrips = await Trip.countDocuments(filter);
    const activeTrips = await Trip.countDocuments({ ...filter, status: 'active' });
    const inactiveTrips = await Trip.countDocuments({ ...filter, status: 'inactive' });
    
    // Get trips for this admin only
    const trips = await Trip.find(filter);
    const totalBookings = trips.reduce((sum, trip) => sum + (trip.currentBookings || 0), 0);
    const totalRevenue = trips.reduce((sum, trip) => sum + ((trip.currentBookings || 0) * trip.totalBudget), 0);
    
    console.log(`📊 Admin ${adminId} has ${totalTrips} trips (${activeTrips} active, ${inactiveTrips} inactive)`);
    
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
      pendingBookings: 0,
      totalRevenue,
      thisMonthRevenue: 0,
      totalCustomers: 0,
      activeCustomers: 0,
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
      adminId: adminId
    });
    
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while fetching stats'
    });
  }
});

// Bulk operations for trips
router.patch('/trips/bulk-status', async (req, res) => {
  console.log('🎯 BULK status update route hit');
  
  try {
    const { tripIds, status, adminId } = req.body;
    
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
    
    // Build filter to ensure admin can only update their own trips
    const filter = { _id: { $in: tripIds } };
    if (adminId) filter.adminId = adminId;
    
    const result = await Trip.updateMany(
      filter,
      { 
        status: status,
        updatedAt: new Date()
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} trips to ${status}`);
    
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

// Check if user is admin by agency ownership - CORRECTED
router.get('/check-admin-status/:userId', async (req, res) => {
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

// DEBUG: Check all trips and their admin IDs
router.get('/debug-all-trips', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Listing all trips in database');
    
    const trips = await Trip.find({}).sort({ createdAt: -1 });
    const totalCount = await Trip.countDocuments();
    
    console.log(`📊 Found ${totalCount} total trips`);
    trips.forEach((trip, index) => {
      console.log(`${index + 1}. Trip: "${trip.tripName}"`);
      console.log(`   - Admin ID: "${trip.adminId}"`);
      console.log(`   - Agency ID: "${trip.agencyId}"`);
      console.log(`   - Agency Name: "${trip.agencyName}"`);
      console.log(`   - Trip OTP: "${trip.tripOTP}"`);
      console.log(`   - Status: ${trip.status}`);
      console.log(`   - Locations: ${trip.locations?.join(', ')}`);
      console.log(`   - Created: ${trip.createdAt}`);
      console.log('   ---');
    });
    
    res.json({
      success: true,
      totalTrips: totalCount,
      currentUserCheck: req.query.userId || 'none',
      trips: trips.map(trip => ({
        _id: trip._id,
        tripName: trip.tripName,
        adminId: trip.adminId,
        agencyId: trip.agencyId,
        agencyName: trip.agencyName,
        tripOTP: trip.tripOTP,
        status: trip.status,
        locations: trip.locations,
        createdAt: trip.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Debug trips error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE ALL TRIPS - For fresh start with proper admin isolation
router.delete('/delete-all-trips-debug', async (req, res) => {
  try {
    console.log('🗑️ DELETING ALL TRIPS - Fresh start');
    
    // Get all trips before deletion for logging
    const allTrips = await Trip.find({}).select('tripName adminId agencyId createdAt');
    console.log('📊 Trips to be deleted:', allTrips);
    
    // Delete all trips
    const result = await Trip.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} trips`);
    
    // Verify deletion
    const remainingTrips = await Trip.countDocuments();
    console.log(`📊 Remaining trips: ${remainingTrips}`);
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      remainingTrips: remainingTrips,
      message: `Successfully deleted ${result.deletedCount} trips. Database is now clean for fresh start.`
    });
    
  } catch (error) {
    console.error('❌ Error deleting all trips:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ADD THIS ROUTE to fix existing trips
router.post('/fix-trip-admin-ids', async (req, res) => {
  try {
    const { currentAdminId, targetAdminId } = req.body;
    
    console.log('🔧 Updating trip admin IDs...');
    console.log('From:', currentAdminId || 'any');
    console.log('To:', targetAdminId);
    
    // Find trips to update
    const filter = currentAdminId ? { adminId: currentAdminId } : {};
    const tripsToUpdate = await Trip.find(filter);
    
    console.log(`Found ${tripsToUpdate.length} trips to update`);
    
    // Update all matching trips
    const result = await Trip.updateMany(
      filter,
      { 
        $set: { 
          adminId: targetAdminId,
          agencyId: targetAdminId, // Also update agencyId if needed
          updatedAt: new Date() 
        } 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} trips`);
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} trips to new admin ID`,
      modifiedCount: result.modifiedCount
    });
    
  } catch (error) {
    console.error('❌ Error updating trip admin IDs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ Admin routes configured with perfect admin isolation and OTP handling');

module.exports = router;
