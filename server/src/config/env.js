// =============================================================================
// Environment Configuration
// =============================================================================
// Centralizes all environment variable access.
// Never scatter process.env reads throughout the codebase.
// =============================================================================

const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SECURITY_MODE: process.env.SECURITY_MODE || 'baseline',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-security-audit',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  AUTH_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 5,

  isBaseline() {
    return this.SECURITY_MODE === 'baseline';
  },
  isHardened() {
    return this.SECURITY_MODE === 'hardened';
  }
};

module.exports = env;
