const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

<<<<<<< HEAD
// CORS Configuration
// Allow localhost during development, your configured FRONTEND_URL, and any Vercel preview/prod domain
const vercelDomainRegex = /^https?:\/\/([a-z0-9-]+)\.vercel\.app(\/?|$)/i;
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL // e.g., https://your-frontend.vercel.app
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (vercelDomainRegex.test(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
=======
// Basic middleware
const allowlist = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    try {
      const hostname = new URL(origin).hostname;
      const isVercelPreview = hostname.endsWith('.vercel.app');
      if (allowlist.includes(origin) || isVercelPreview) return cb(null, true);
    } catch (_) {}
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
>>>>>>> 39bae5b3e83cd7ccf69d745406a7e58cc9ab113d
}));
// Explicitly handle preflight for all routes
app.options('*', cors());
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

// Universal preflight responder to avoid 404 on OPTIONS in serverless
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
    }
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Authorization,Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(204);
  }
  next();
});

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
