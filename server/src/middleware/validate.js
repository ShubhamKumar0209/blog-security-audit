// =============================================================================
// Input Validation Middleware (HARDENED ONLY)
// =============================================================================
// WHY (V-03 — Weak Input Validation):
//   Without server-side validation:
//   - Users can submit empty or malformed data
//   - Extremely long inputs can waste server resources
//   - Invalid types can cause unexpected behavior
//   - Missing required fields lead to database errors
//
// This middleware provides:
//   - Type checks
//   - Length limits
//   - Required field enforcement
//   - Allowed value constraints
//   - Proper error responses
//
// NOTE: Input validation is NOT the same as output encoding.
//   Validation rejects malformed input.
//   Encoding makes output safe for the rendering context.
//   Both are needed for defense in depth.
// =============================================================================

const env = require('../config/env');

// Validation rules
const rules = {
  register: {
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    email: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, maxLength: 254 },
    password: {
      required: true,
      type: 'string',
      minLength: 8,
      maxLength: 128,
      // At least: 1 uppercase, 1 lowercase, 1 number, 1 special char
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    }
  },
  login: {
    email: { required: true, type: 'string', maxLength: 254 },
    password: { required: true, type: 'string', maxLength: 128 }
  },
  createPost: {
    title: { required: true, type: 'string', minLength: 3, maxLength: 200 },
    content: { required: true, type: 'string', minLength: 10, maxLength: 50000 }
  },
  updatePost: {
    title: { type: 'string', minLength: 3, maxLength: 200 },
    content: { type: 'string', minLength: 10, maxLength: 50000 }
  },
  createComment: {
    content: { required: true, type: 'string', minLength: 1, maxLength: 5000 }
  }
};

function validate(ruleName) {
  return function (req, res, next) {
    if (env.isBaseline()) {
      // BASELINE V-03: No validation middleware
      return next();
    }

    const ruleSet = rules[ruleName];
    if (!ruleSet) {
      return next();
    }

    const errors = [];

    for (const [field, constraints] of Object.entries(ruleSet)) {
      const value = req.body[field];

      // Required check
      if (constraints.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required.` });
        continue;
      }

      // Skip optional fields that aren't provided
      if (value === undefined || value === null) continue;

      // Type check
      if (constraints.type && typeof value !== constraints.type) {
        errors.push({ field, message: `${field} must be a ${constraints.type}.` });
        continue;
      }

      // String-specific checks
      if (typeof value === 'string') {
        if (constraints.minLength && value.length < constraints.minLength) {
          errors.push({ field, message: `${field} must be at least ${constraints.minLength} characters.` });
        }
        if (constraints.maxLength && value.length > constraints.maxLength) {
          errors.push({ field, message: `${field} must be at most ${constraints.maxLength} characters.` });
        }
        if (constraints.pattern && !constraints.pattern.test(value)) {
          if (field === 'password') {
            errors.push({ field, message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' });
          } else if (field === 'email') {
            errors.push({ field, message: 'Please provide a valid email address.' });
          } else {
            errors.push({ field, message: `${field} format is invalid.` });
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed.',
        details: errors
      });
    }

    next();
  };
}

// Validate MongoDB ObjectId format in route params
function validateObjectId(paramName) {
  return function (req, res, next) {
    if (env.isBaseline()) return next();

    const id = req.params[paramName];
    if (id && !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ error: `Invalid ${paramName} format.` });
    }
    next();
  };
}

module.exports = { validate, validateObjectId };
