const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// --------------- Security Middleware ---------------

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? false : undefined,
    crossOriginEmbedderPolicy: false,
  })
);

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// --------------- Rate Limiting ---------------

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// --------------- Body Parsing ---------------

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --------------- Logging ---------------

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// --------------- Health Check ---------------

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Attendance System API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// --------------- API Routes ---------------

// Apply stricter rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Route placeholders — import actual route files once created
try {
  app.use('/api/auth', require('./routes/auth'));
} catch (e) {
  app.use('/api/auth', (req, res) => {
    res.status(503).json({ success: false, message: 'Auth routes not yet implemented' });
  });
}

try {
  app.use('/api/admin', require('./routes/admin'));
} catch (e) {
  app.use('/api/admin', (req, res) => {
    res.status(503).json({ success: false, message: 'Admin routes not yet implemented' });
  });
}

try {
  app.use('/api/teacher', require('./routes/teacher'));
} catch (e) {
  app.use('/api/teacher', (req, res) => {
    res.status(503).json({ success: false, message: 'Teacher routes not yet implemented' });
  });
}

try {
  app.use('/api/student', require('./routes/student'));
} catch (e) {
  app.use('/api/student', (req, res) => {
    res.status(503).json({ success: false, message: 'Student routes not yet implemented' });
  });
}

try {
  app.use('/api/parent', require('./routes/parent'));
} catch (e) {
  app.use('/api/parent', (req, res) => {
    res.status(503).json({ success: false, message: 'Parent routes not yet implemented' });
  });
}

// --------------- Serve Frontend in Production ---------------

const path = require('path');
const frontendBuildPath = path.join(__dirname, '..', '..', 'frontend', 'dist');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// --------------- 404 Handler ---------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// --------------- Global Error Handler ---------------

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
