// =============================================================================
// Error Handler Middleware
// =============================================================================
// SECURITY BASELINE (V-06 — Excessive Error Information):
//   Exposes stack traces, internal file paths, database errors, and
//   dependency details in HTTP responses. This helps attackers understand
//   the application's internal structure.
//
// HARDENED:
//   Returns generic client-facing error messages.
//   Logs detailed errors internally with request IDs.
//   Never exposes stack traces, paths, or DB details to clients.
// =============================================================================

const env = require('../config/env');
const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;

  if (env.isBaseline()) {
    // -------------------------------------------------------------------------
    // VULNERABILITY V-06: Verbose error disclosure
    // Stack traces, internal paths, and database error details are exposed.
    // An attacker can use this to learn about the application's technology
    // stack, file structure, and database schema.
    // -------------------------------------------------------------------------
    return res.status(statusCode).json({
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      details: err.errors || err.details || null,
      database_error: err.code ? { code: err.code, codeName: err.codeName } : undefined
    });
  }

  // ---------------------------------------------------------------------------
  // HARDENED: Generic client response + detailed internal logging
  // ---------------------------------------------------------------------------
  logger.error('Request error', {
    requestId: req.requestId,
    statusCode,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Map known error types to safe messages
  let clientMessage = 'An unexpected error occurred. Please try again later.';

  if (statusCode === 400) clientMessage = err.message || 'Invalid request.';
  if (statusCode === 401) clientMessage = 'Authentication required.';
  if (statusCode === 403) clientMessage = 'You do not have permission to perform this action.';
  if (statusCode === 404) clientMessage = 'The requested resource was not found.';
  if (statusCode === 409) clientMessage = 'A conflict occurred with the current state of the resource.';
  if (statusCode === 429) clientMessage = 'Too many requests. Please slow down.';

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed.',
      requestId: req.requestId
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'A resource with that identifier already exists.',
      requestId: req.requestId
    });
  }

  return res.status(statusCode).json({
    error: clientMessage,
    requestId: req.requestId
  });
}

module.exports = errorHandler;
