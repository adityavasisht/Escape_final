const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// MongoDB connection with simple cache for serverless
let cachedConnection = null;
async function connectToDatabase() {
  if (cachedConnection) return cachedConnection;
  cachedConnection = await mongoose.connect(process.env.MONGODB_URI);
  return cachedConnection;
}

connectToDatabase()
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
const adminRoutes = require('./routes/admin');
const tripRoutes = require('./routes/trips');

app.use('/api/admin', adminRoutes);
app.use('/api/trips', tripRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Escape Backend Working!', 
    timestamp: new Date() 
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Export the app for Vercel serverless
module.exports = app;
