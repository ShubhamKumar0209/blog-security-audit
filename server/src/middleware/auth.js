// =============================================================================
// Authentication Middleware
// =============================================================================
// SECURITY BASELINE (V-01 — CVE-2022-23541):
//   In baseline mode, jwt.verify() is called WITHOUT specifying the
//   `algorithms` option. jsonwebtoken <= 8.5.1 can be misconfigured to
//   accept tokens signed with a different algorithm than intended,
//   potentially allowing forged tokens.
//
// HARDENED:
//   Explicitly specifies `algorithms: ['HS256']` to prevent algorithm
//   confusion attacks. Also upgrades jsonwebtoken to 9.0.2+.
// =============================================================================

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../utils/logger');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    let decoded;

    if (env.isBaseline()) {
      // -----------------------------------------------------------------------
      // VULNERABILITY V-01: No algorithm restriction
      // CVE-2022-23541 — jsonwebtoken <= 8.5.1 does not enforce algorithm
      // when algorithms option is omitted, potentially allowing algorithm
      // confusion if a key retrieval function is poorly implemented.
      // -----------------------------------------------------------------------
      decoded = jwt.verify(token, env.JWT_SECRET);
    } else {
      // -----------------------------------------------------------------------
      // HARDENED: Explicitly restrict to HS256 only
      // This prevents algorithm confusion attacks.
      // -----------------------------------------------------------------------
      decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256']
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    logger.warn('JWT verification failed', { error: error.message, requestId: req.requestId });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

// Optional auth — sets req.user if token present, but doesn't require it
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  authenticate(req, res, next);
}

module.exports = { authenticate, optionalAuth };
