const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000', // Development
    'https://esacep-p6yf.vercel.app', // Your main frontend URL
    'https://esacep-p6yf-git-master-adityas-projects-248e2e3c.vercel.app', // Frontend preview
    'https://esacep-p6yf-87fwamxqj-adityas-projects-248e2e3c.vercel.app', // Another frontend preview
    'https://esacep.vercel.app', // Your backend URL
    'https://*.vercel.app' // All Vercel domains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('/*', cors());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/escape', {
  serverSelectionTimeoutMS: 50000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
});

// Other middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import and use your route files
const adminRoutes = require('./routes/admin');
const tripsRoutes = require('./routes/trips');

app.use('/api/admin', adminRoutes);
app.use('/api/trips', tripsRoutes);

// Add root route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Escape Backend is running!', 
    timestamp: new Date(),
    status: 'OK'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    port: process.env.PORT || 5001,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

const PORT = process.env.PORT || 5001;

// Only listen when running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 ESCAPE BACKEND RUNNING ON PORT ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
  });
}

// CRITICAL: Export the app for Vercel
module.exports = app;
