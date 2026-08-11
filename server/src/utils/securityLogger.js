// =============================================================================
// Security Logger
// =============================================================================
// WHY: Detect and investigate security-relevant events.
// Logs structured security events with metadata for audit purposes.
//
// IMPORTANT: Never log passwords, JWT secrets, raw tokens, or sensitive
// personal data. These are excluded because:
// - Passwords in logs would create a secondary credential exposure vector
// - JWT secrets in logs would allow token forgery
// - Raw tokens in logs could enable session hijacking via log access
// =============================================================================

const logger = require('./logger');

const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE',
  RATE_LIMIT_TRIGGERED: 'RATE_LIMIT_TRIGGERED',
  VALIDATION_FAILURE: 'VALIDATION_FAILURE',
  ADMIN_ACTION: 'ADMIN_ACTION',
  RESOURCE_ACCESS_DENIED: 'RESOURCE_ACCESS_DENIED',
  SERVER_ERROR: 'SERVER_ERROR',
  REGISTRATION: 'REGISTRATION',
  XSS_ATTEMPT_BLOCKED: 'XSS_ATTEMPT_BLOCKED'
};

function logSecurityEvent(event, metadata = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...metadata
  };

  // Ensure we never log sensitive data
  delete entry.password;
  delete entry.token;
  delete entry.secret;
  delete entry.passwordHash;

  logger.info(`[SECURITY] ${event}`, entry);
}

module.exports = { SECURITY_EVENTS, logSecurityEvent };
