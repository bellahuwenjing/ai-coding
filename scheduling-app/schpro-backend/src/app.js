const express = require('express');
const cors = require('cors');
const Sentry = require('@sentry/node');
// Note: dotenv is loaded in supabase.service.js

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
});

const app = express();

app.use(Sentry.Handlers.requestHandler());

// Import routes
const authRoutes = require('./routes/auth.routes');
const peopleRoutes = require('./routes/people.routes');
const vehiclesRoutes = require('./routes/vehicles.routes');
const equipmentRoutes = require('./routes/equipment.routes');
const bookingRoutes = require('./routes/booking.routes');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SchedulePro API is running',
    timestamp: new Date().toISOString()
  });
});

app.use(Sentry.Handlers.errorHandler());

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

module.exports = app;
