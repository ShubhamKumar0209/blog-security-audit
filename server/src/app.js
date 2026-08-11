// =============================================================================
// Express Application — Main Entry Point
// =============================================================================
// SECURITY BASELINE / INTENTIONALLY VULNERABLE (when SECURITY_MODE=baseline)
//   This application intentionally contains controlled security weaknesses
//   for academic demonstration of the vulnerability lifecycle:
//   Build → Fingerprint → Identify → Map CVEs → Assess → Demo → Remediate
//
// The application runs in two modes:
//   SECURITY_MODE=baseline  → Intentionally insecure (for demonstration)
//   SECURITY_MODE=hardened  → Security controls applied
//
// MIDDLEWARE PIPELINE (HARDENED):
//   Request → Request ID → Security Headers → CORS → Rate Limiting →
//   Body Parsing → Input Validation → Authentication → Authorization →
//   Controller → Database → Error Handler → Response
//
// WHY ordering matters:
//   1. Request ID first: every log entry gets correlated
//   2. Security headers early: applies to all responses including errors
//   3. CORS before routing: rejects disallowed origins before processing
//   4. Rate limiting before parsing: saves resources on abusive requests
//   5. Body parsing before validation: need parsed body to validate
//   6. Auth before controllers: ensures identity is established
//   7. Error handler last: catches everything that wasn't handled
// =============================================================================

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Middleware
const requestId = require('./middleware/requestId');
const securityHeaders = require('./middleware/securityHeaders');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter, authLimiter, commentLimiter } = require('./middleware/rateLimiter');
const { validate, validateObjectId } = require('./middleware/validate');

// Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// =============================================================================
// 1. Request ID (always active)
// =============================================================================
app.use(requestId);

// =============================================================================
// 2. Security Headers
// =============================================================================
// BASELINE: No headers applied (V-02)
// HARDENED: CSP, X-Content-Type-Options, Referrer-Policy, etc.
app.use(securityHeaders);

// =============================================================================
// 3. CORS Configuration
// =============================================================================
if (env.isBaseline()) {
  // BASELINE: Permissive CORS — reflects origin to allow credentials insecurely
  app.use(cors({
    origin: function (origin, callback) {
      callback(null, origin || '*');
    },
    credentials: true
  }));
} else {
  // HARDENED: Explicit origin allowlist
  app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
}

// =============================================================================
// 3.5 Cookie Parser
// =============================================================================
app.use(cookieParser());

// =============================================================================
// 4. Rate Limiting (hardened only)
// =============================================================================
app.use('/api/', generalLimiter);

// =============================================================================
// 5. Body Parsing
// =============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================================================
// 6. Request Logging
// =============================================================================
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// =============================================================================
// 7. API Routes
// =============================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: env.SECURITY_MODE,
    timestamp: new Date().toISOString()
  });
});

// Fingerprinting info endpoint (for security audit demonstration)
// In production, this would never exist. Here it helps demonstrate
// what information an application might inadvertently expose.
app.get('/api/info', (req, res) => {
  if (env.isBaseline()) {
    // BASELINE: Exposes technology stack information
    res.json({
      application: 'Blog Security Audit',
      runtime: `Node.js ${process.version}`,
      framework: 'Express',
      database: 'MongoDB',
      security_mode: env.SECURITY_MODE
    });
  } else {
    // HARDENED: Minimal information
    res.json({
      application: 'Blog Security Audit',
      security_mode: env.SECURITY_MODE
    });
  }
});

// Auth routes — with stricter rate limiting on auth endpoints
app.use('/api/auth', authLimiter, authRoutes);

// Post routes
app.use('/api/posts', postRoutes);

// Comment routes — with comment-specific rate limiting
app.use('/api/comments', commentLimiter, commentRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// =============================================================================
// 8. 404 Handler
// =============================================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// =============================================================================
// 9. Error Handler (always last)
// =============================================================================
app.use(errorHandler);

// =============================================================================
// Start Server
// =============================================================================
async function start() {
  await connectDB();

  app.listen(env.PORT, () => {
    logger.info(`Server started on port ${env.PORT}`);
    logger.info(`Security Mode: ${env.SECURITY_MODE.toUpperCase()}`);
    logger.info(`Environment: ${env.NODE_ENV}`);

    if (env.isBaseline()) {
      logger.warn('⚠️  RUNNING IN BASELINE MODE — INTENTIONALLY VULNERABLE');
      logger.warn('   This mode contains controlled security weaknesses.');
      logger.warn('   DO NOT use in production.');
    } else {
      logger.info('✅ Running in HARDENED mode — Security controls active');
    }
  });
}

start().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
