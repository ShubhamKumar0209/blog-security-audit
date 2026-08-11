// =============================================================================
// Rate Limiter Middleware (HARDENED ONLY)
// =============================================================================
// WHY (V-05 — Weak Rate Limiting):
//   Without rate limiting, attackers can:
//   - Brute-force login credentials at unlimited speed
//   - Overwhelm the server with registration spam
//   - Flood comments
//   - Cause denial of service
//
// HARDENED:
//   Authentication endpoints: 5 requests per 15 minutes
//   General API endpoints: 100 requests per 15 minutes
//   Returns HTTP 429 Too Many Requests with Retry-After header
// =============================================================================

const env = require('../config/env');
const { logSecurityEvent, SECURITY_EVENTS } = require('../utils/securityLogger');

// Simple in-memory rate limiter (production would use Redis)
const requestCounts = new Map();

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || env.RATE_LIMIT_WINDOW_MS;
  const max = options.max || env.RATE_LIMIT_MAX_REQUESTS;
  const message = options.message || 'Too many requests, please try again later.';

  return function rateLimiter(req, res, next) {
    if (env.isBaseline()) {
      // BASELINE V-05: No rate limiting
      return next();
    }

    const key = `${options.prefix || 'global'}:${req.ip}`;
    const now = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = requestCounts.get(key);

    if (now > record.resetTime) {
      // Window expired, reset
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count++;

    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_TRIGGERED, {
        requestId: req.requestId,
        ip: req.ip,
        route: req.path,
        method: req.method,
        limit: max,
        windowMs
      });

      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: message,
        retryAfter
      });
    }

    next();
  };
}

// Pre-configured limiters
const generalLimiter = createRateLimiter({
  prefix: 'general',
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});

const authLimiter = createRateLimiter({
  prefix: 'auth',
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many authentication attempts, please try again after 15 minutes.'
});

const commentLimiter = createRateLimiter({
  prefix: 'comment',
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many comments, please slow down.'
});

module.exports = { createRateLimiter, generalLimiter, authLimiter, commentLimiter };
