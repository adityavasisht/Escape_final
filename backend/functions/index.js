const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://esacep-p6yf.vercel.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Get environment variables from Firebase config
const config = functions.config();
const MONGODB_URI = config.mongodb?.uri;
const CLERK_SECRET = config.clerk?.secret;

// MongoDB connection
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err));
} else {
  console.log('⚠️ MongoDB URI not found in config');
}

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Escape Backend on Firebase Functions!', 
    timestamp: new Date(),
    config_status: {
      mongodb: !!MONGODB_URI,
      clerk: !!CLERK_SECRET
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    platform: 'Firebase Functions',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
