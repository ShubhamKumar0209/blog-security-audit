const helmet = require('helmet');
const env = require('../config/env');

function securityHeaders(req, res, next) {
  if (env.isBaseline()) {
    // BASELINE: No security headers applied.
    // X-Powered-By: Express is still present (Express default).
    return next();
  }

  // HARDENED: Use helmet for comprehensive security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "http://localhost:5000", "http://localhost:5001"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    // Prevent MIME sniffing
    xContentTypeOptions: true,
    // Referrer policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Prevent clickjacking
    xFrameOptions: { action: 'deny' },
    // Remove X-Powered-By
    hidePoweredBy: true,
    // HSTS disabled for local dev
    hsts: false
  })(req, res, () => {
    // Permissions policy — disable features not needed by a blog
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
    // XSS Protection (legacy)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

module.exports = securityHeaders;
