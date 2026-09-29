// =============================================================================
// Logger Utility
// =============================================================================
// BASELINE: Simple console logger with minimal structure.
// HARDENED: Enhanced with structured JSON output (see securityLogger.js).
// =============================================================================

const env = require('../config/env');

const LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  if (env.isHardened()) {
    // Structured JSON logging for hardened mode
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  }
  // Simple text logging for baseline
  return `[${timestamp}] [${level}] ${message}`;
}

const logger = {
  info(message, meta) {
    console.log(formatMessage(LEVELS.INFO, message, meta));
  },
  warn(message, meta) {
    console.warn(formatMessage(LEVELS.WARN, message, meta));
  },
  error(message, meta) {
    console.error(formatMessage(LEVELS.ERROR, message, meta));
  },
  debug(message, meta) {
    if (env.NODE_ENV === 'development') {
      console.debug(formatMessage(LEVELS.DEBUG, message, meta));
    }
  }
};

module.exports = logger;
