require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const employeeRoutes = require('./routes/employee.routes');
const creativeRoutes = require('./routes/creative.routes');
const webdevRoutes = require('./routes/webdev.routes');
const courseRoutes = require('./routes/course.routes');
const webinarRoutes = require('./routes/webinar.routes');
const paymentRoutes = require('./routes/payment.routes');
const uploadRoutes = require('./routes/upload.routes');
const approvalRoutes = require('./routes/approval.routes');
const reviewRoutes = require('./routes/review.routes');
const socialRoutes = require('./routes/social.routes');
const blogRoutes = require('./routes/blog.routes');

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing — 50mb to support Cloudinary base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting - Relaxed for Development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // Practically disable in dev
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 20, // Practically disable in dev
  message: { error: 'Too many auth attempts, please try again later.' }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Zanxa Tech API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/services/creative', creativeRoutes);
app.use('/api/services/webdev', webdevRoutes);
app.use('/api/services/courses', courseRoutes);
app.use('/api/services/webinars', webinarRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/auth/social', socialRoutes);
app.use('/api/blogs', blogRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
