const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://esacep-p6yf.vercel.app'],
  credentials: true
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Escape Backend Working!', 
    timestamp: new Date() 
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 ESCAPE BACKEND RUNNING ON PORT ${PORT}`);
});
