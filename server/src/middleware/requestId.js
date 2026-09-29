// =============================================================================
// Request ID Middleware
// =============================================================================
// WHY: Assigns a unique ID to every request for log correlation.
// This helps trace a request through the entire middleware pipeline
// when investigating security incidents or debugging issues.
// =============================================================================

const { v4: uuidv4 } = require('uuid');

function requestId(req, res, next) {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

module.exports = requestId;
