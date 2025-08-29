const express = require('express');
const app = express();

// In-memory storage for trips (replace with database later)
let trips = [];
let tripIdCounter = 1;

// Ultra permissive CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS handled for:', req.url);
    return res.status(200).end();
  }
  
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: '50mb' }));

// CREATE: Add new trip
app.post('/api/admin/trips', (req, res) => {
  console.log('🎯 Creating new trip');
  console.log('📦 Data:', req.body);
  
  const trip = {
    id: tripIdCounter++,
    ...req.body,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  trips.push(trip);
  console.log(`✅ Trip created: ${trip.tripName} (ID: ${trip.id})`);
  console.log(`📊 Total trips: ${trips.length}`);
  
  res.status(201).json({
    success: true,
    message: 'Trip created successfully!',
    trip: trip
  });
});

// READ: Get all trips for admin
app.get('/api/admin/trips', (req, res) => {
  console.log('📋 Fetching all trips for admin');
  console.log(`📊 Found ${trips.length} trips`);
  
  res.json({
    success: true,
    trips: trips,
    total: trips.length
  });
});

// READ: Get single trip by ID
app.get('/api/admin/trips/:id', (req, res) => {
  const tripId = parseInt(req.params.id);
  const trip = trips.find(t => t.id === tripId);
  
  if (!trip) {
    return res.status(404).json({
      success: false,
      error: 'Trip not found'
    });
  }
  
  console.log(`📋 Fetching trip: ${trip.tripName}`);
  
  res.json({
    success: true,
    trip: trip
  });
});

// UPDATE: Edit existing trip
app.put('/api/admin/trips/:id', (req, res) => {
  const tripId = parseInt(req.params.id);
  const tripIndex = trips.findIndex(t => t.id === tripId);
  
  if (tripIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Trip not found'
    });
  }
  
  console.log(`✏️ Updating trip ID: ${tripId}`);
  console.log('📦 Update data:', req.body);
  
  // Update trip with new data
  trips[tripIndex] = {
    ...trips[tripIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  console.log(`✅ Trip updated: ${trips[tripIndex].tripName}`);
  
  res.json({
    success: true,
    message: 'Trip updated successfully!',
    trip: trips[tripIndex]
  });
});

// DELETE: Remove trip
app.delete('/api/admin/trips/:id', (req, res) => {
  const tripId = parseInt(req.params.id);
  const tripIndex = trips.findIndex(t => t.id === tripId);
  
  if (tripIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Trip not found'
    });
  }
  
  const deletedTrip = trips.splice(tripIndex, 1)[0];
  console.log(`🗑️ Deleted trip: ${deletedTrip.tripName}`);
  
  res.json({
    success: true,
    message: 'Trip deleted successfully!'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    port: 8000, 
    tripsCount: trips.length 
  });
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`🚀 ADMIN BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET    /api/admin/trips`);
  console.log(`   POST   /api/admin/trips`);
  console.log(`   GET    /api/admin/trips/:id`);
  console.log(`   PUT    /api/admin/trips/:id`);
  console.log(`   DELETE /api/admin/trips/:id`);
});
