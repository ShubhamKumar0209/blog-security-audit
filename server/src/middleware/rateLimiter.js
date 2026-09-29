const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { logSecurityEvent, SECURITY_EVENTS } = require('../utils/securityLogger');

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || env.RATE_LIMIT_WINDOW_MS;
  const max = options.max || env.RATE_LIMIT_MAX_REQUESTS;
  const message = options.message || 'Too many requests, please try again later.';

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    skip: () => env.isBaseline(),
    handler: (req, res, next, optionsVal) => {
      logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_TRIGGERED, {
        requestId: req.requestId,
        ip: req.ip,
        route: req.path,
        method: req.method,
        limit: optionsVal.max,
        windowMs: optionsVal.windowMs
      });
      res.status(optionsVal.statusCode).send(optionsVal.message);
    }
  });
}

// Pre-configured limiters
const generalLimiter = createRateLimiter({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});

const authLimiter = createRateLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many authentication attempts, please try again after 15 minutes.'
});

const commentLimiter = createRateLimiter({
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many comments, please slow down.'
});

module.exports = { createRateLimiter, generalLimiter, authLimiter, commentLimiter };
