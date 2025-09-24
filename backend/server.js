const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS Configuration: allow localhost, configured FRONTEND_URL, and any Vercel/Render preview/prod domain
const vercelDomainRegex = /^https?:\/\/([a-z0-9-]+)\.vercel\.app(\/?|$)/i;
const renderDomainRegex = /^https?:\/\/([a-z0-9-]+)\.onrender\.com(\/?|$)/i;
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    try {
      const hostname = new URL(origin).hostname;
      const isVercelPreview = hostname.endsWith('.vercel.app');
      const isRenderDomain = hostname.endsWith('.onrender.com');
      if (allowedOrigins.includes(origin) || isVercelPreview || isRenderDomain) return callback(null, true);
    } catch (_) {
      // If URL parsing fails, fall back to direct checks
      if (allowedOrigins.includes(origin) || vercelDomainRegex.test(origin) || renderDomainRegex.test(origin)) return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Start server when running on Render or in local development. Do not listen on Vercel serverless.
const PORT = process.env.PORT || 5001;
if (process.env.RENDER || process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Escape backend listening on port ${PORT}`);
  });
}

// Export the app (Vercel uses this export; harmless on Render/local)
module.exports = app;
