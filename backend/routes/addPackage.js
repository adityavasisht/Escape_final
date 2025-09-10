// routes/addPackage.js
const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const Trip = require('../models/Trip'); // Using your existing Trip model

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// POST route for adding packages with itinerary images
router.post('/', upload.array('itineraryImages', 10), async (req, res) => {
  try {
    const imageUrls = [];
    
    // Upload each image to Cloudinary if files are provided
    if (req.files && req.files.length > 0) {
      console.log(`Uploading ${req.files.length} images to Cloudinary...`);
      
      for (const file of req.files) {
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
      }
      
      console.log('Images uploaded successfully:', imageUrls.length);
    }
    
    // Create package data with itinerary images
    const packageData = {
      ...req.body,
      itineraryImages: imageUrls,
      createdAt: new Date()
    };
    
    // Save to your Trip model
    const newPackage = new Trip(packageData);
    await newPackage.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Package created successfully with itinerary images!',
      package: newPackage,
      imageCount: imageUrls.length
    });
    
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create package'
    });
  }
});

// GET route to fetch all packages (if you need it)
router.get('/', async (req, res) => {
  try {
    const packages = await Trip.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      packages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
