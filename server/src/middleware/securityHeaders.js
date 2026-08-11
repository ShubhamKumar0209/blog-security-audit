// =============================================================================
// Security Headers Middleware (HARDENED ONLY)
// =============================================================================
// WHY: Missing HTTP security headers (V-02) allow various attack classes:
//
// Content-Security-Policy (CSP):
//   WHAT: Restricts which scripts, styles, and resources the browser loads.
//   WHY:  Defense-in-depth against XSS. Even if an attacker injects a script
//         tag, CSP can prevent the browser from executing it.
//   NOTE: Input validation alone is NOT sufficient to prevent XSS because
//         validation can be bypassed via encoding tricks, mutation XSS, etc.
//
// X-Content-Type-Options: nosniff
//   WHAT: Prevents browsers from MIME-sniffing a response away from the
//         declared content-type.
//   WHY:  Mitigates attacks where an attacker tricks the browser into treating
//         non-script content as executable JavaScript.
//
// Referrer-Policy: strict-origin-when-cross-origin
//   WHAT: Controls how much referrer information is shared in requests.
//   WHY:  Prevents leaking sensitive URL parameters to third-party sites.
//
// Permissions-Policy:
//   WHAT: Controls which browser features (camera, mic, geolocation) the
//         page can use.
//   WHY:  Reduces attack surface by disabling unnecessary browser APIs.
//
// NOTE ON HSTS:
//   NOT enabled because this is an HTTP-only development setup.
//   Enabling HSTS on HTTP would break the application.
//   HSTS should only be enabled when HTTPS is properly configured.
//
// X-Powered-By:
//   Removed by Helmet by default. Exposing "Express" helps attackers
//   fingerprint the backend framework and find version-specific exploits.
// =============================================================================

const env = require('../config/env');

function securityHeaders(req, res, next) {
  if (env.isBaseline()) {
    // BASELINE: No security headers applied.
    // X-Powered-By: Express is still present (Express default).
    return next();
  }

  // Remove X-Powered-By to reduce fingerprinting surface
  res.removeHeader('X-Powered-By');

  // Content-Security-Policy
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' http://localhost:5000",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy — disable features not needed by a blog
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS Protection (legacy, but still useful for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
}

module.exports = securityHeaders;
