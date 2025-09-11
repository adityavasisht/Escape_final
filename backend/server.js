const express = require('express');
const cors = require('cors'); // Add this import
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS Configuration - ADD THIS BEFORE OTHER MIDDLEWARE
app.use(cors({
  origin: 'http://localhost:3000', // Allow your React app
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Handle preflight requests
app.options('/*', cors());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/escape')
.then(() => {
  console.log('✅ Connected to MongoDB');
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

// Health check
// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    port: PORT, // Change from hardcoded 5000 to PORT variable
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 ESCAPE BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});
