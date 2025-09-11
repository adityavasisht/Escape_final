const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Trip = require('../models/Trip');
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

// Create new trip (POST /api/admin/trips)
router.post('/trips', upload.array('itineraryImages', 10), async (req, res) => {
  console.log('🎯🎯🎯 ADMIN.JS ROUTE HIT - MONGODB VERSION 🎯🎯🎯');
  console.log('📦 Request body keys:', Object.keys(req.body));
  console.log('📦 Trip name:', req.body.tripName);
  console.log('📦 Total budget:', req.body.totalBudget);
  console.log('📸 Files uploaded:', req.files?.length || 0);
  console.log('🔗 Mongoose connection state:', mongoose.connection.readyState);
  console.log('🔗 Database name:', mongoose.connection.name);
  
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
      
      console.log(`📸 Successfully uploaded ${imageUrls.length}/${req.files.length} images`);
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
      maxCapacity
    } = req.body;
    
    // Validate required fields
    if (!tripName) {
      return res.status(400).json({
        success: false,
        error: 'Trip name is required'
      });
    }
    
    if (!totalBudget || parseFloat(totalBudget) <= 0) {
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
    
    if (!maxCapacity || parseInt(maxCapacity) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid maximum capacity is required'
      });
    }
    
    // Create and SAVE the trip to database
    const newTrip = new Trip({
      tripName: tripName.toString(),
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
      adminId: 'temp-admin-id',
      agencyName: 'Escape Travel Agency',
      itineraryImages: imageUrls
    });
    
    console.log('💾 About to save trip to database...');
    const savedTrip = await newTrip.save();
    console.log('✅ Trip SAVED to database with ID:', savedTrip._id);
    
    res.status(201).json({
      success: true,
      trip: savedTrip,
      message: `Trip "${tripName}" created successfully with ${imageUrls.length} itinerary images!`,
      imageCount: imageUrls.length
    });
    
  } catch (error) {
    console.error('❌❌❌ FULL ERROR DETAILS ❌❌❌');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    console.error('Mongoose connection state:', mongoose.connection.readyState);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while creating trip',
      mongooseState: mongoose.connection.readyState
    });
  }
});

// Get all trips for admin (GET /api/admin/trips)
router.get('/trips', async (req, res) => {
  console.log('🎯 GET /api/admin/trips route hit');
  
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });
    
    console.log(`✅ Found ${trips.length} trips in database`);
    
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

// Update trip (PUT /api/admin/trips/:id)
router.put('/trips/:id', upload.array('itineraryImages', 10), async (req, res) => {
  console.log(`🎯 PUT /api/admin/trips/${req.params.id} route hit`);
  console.log('📦 Update data:', req.body);
  console.log('📸 Files uploaded:', req.files?.length || 0);
  
  try {
    const tripId = req.params.id;
    
    if (!tripId) {
      return res.status(400).json({
        success: false,
        error: 'Trip ID is required'
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
      maxCapacity: parseInt(req.body.maxCapacity)
    };
    
    // Add new images if any were uploaded
    if (imageUrls.length > 0) {
      updateData.itineraryImages = imageUrls;
    }
    
    // UPDATE IN DATABASE
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }
    
    console.log(`✅ Trip ${tripId} updated in database`);
    
    res.json({
      success: true,
      trip: updatedTrip,
      message: `Trip "${updatedTrip.tripName}" updated successfully`,
      imageCount: imageUrls.length
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
    const tripId = req.params.id;
    const deletedTrip = await Trip.findByIdAndDelete(tripId);
    
    if (!deletedTrip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
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

// Test simple save endpoint
router.post('/test-save', async (req, res) => {
  console.log('🧪 TESTING SIMPLE SAVE...');
  try {
    const testTrip = new Trip({
      tripName: 'Simple Test Trip',
      totalBudget: 5000,
      locations: ['Test City'],
      maxCapacity: 10
    });
    
    console.log('💾 About to save test trip...');
    const saved = await testTrip.save();
    console.log('✅ Test trip SAVED with ID:', saved._id);
    
    res.json({ 
      success: true, 
      message: 'Test save worked!', 
      trip: saved 
    });
  } catch (error) {
    console.error('❌ Test save FAILED:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get admin dashboard stats (GET /api/admin/stats)
router.get('/stats', async (req, res) => {
  console.log('🎯 GET /api/admin/stats route hit');
  
  try {
    const totalTrips = await Trip.countDocuments();
    const activeTrips = await Trip.countDocuments({ status: 'active' });
    
    const stats = {
      totalTrips,
      activeTrips,
      totalBookings: 0, // You can calculate this based on your booking model
      pendingBookings: 0,
      totalRevenue: 0,
      thisMonthRevenue: 0,
      totalCustomers: 0,
      activeCustomers: 0,
      averageRating: 4.6,
      topDestinations: []
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

console.log('✅ Admin routes configured with database integration');

module.exports = router;
