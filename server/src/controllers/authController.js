// =============================================================================
// Auth Controller
// =============================================================================
// Handles: Register, Login, Logout, Get Profile
//
// SECURITY BASELINE (V-03 — Weak Input Validation):
//   - No password strength requirements
//   - No input length limits on name/email
//   - No email format validation beyond Mongoose
//   - No sanitization of input
//
// HARDENED:
//   - Strong password requirements (min 8 chars, upper, lower, number, special)
//   - Input validation via express-validator middleware (in routes)
//   - Proper error messages that don't reveal user existence
// =============================================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const env = require('../config/env');
const logger = require('../utils/logger');

// Helper to generate both tokens and save refresh token to DB
async function generateTokens(user) {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: 'HS256'
  });

  const refreshTokenStr = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    algorithm: 'HS256'
  });

  // Calculate expiration date based on env string (e.g., '7d')
  // Simple parser: assuming format like '7d', '24h', '60m'
  let addTime = 7 * 24 * 60 * 60 * 1000; // default 7 days
  const match = String(env.JWT_REFRESH_EXPIRES_IN).match(/^(\d+)([dhms])$/);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 'd') addTime = val * 24 * 60 * 60 * 1000;
    else if (unit === 'h') addTime = val * 60 * 60 * 1000;
    else if (unit === 'm') addTime = val * 60 * 1000;
    else if (unit === 's') addTime = val * 1000;
  }
  
  const expiresAt = new Date(Date.now() + addTime);

  // Save refresh token to DB
  await RefreshToken.create({
    token: refreshTokenStr,
    user: user._id,
    expiresAt
  });

  return { accessToken, refreshToken: refreshTokenStr };
}

// Helper to set cookie based on security mode
function setRefreshTokenCookie(res, refreshTokenStr) {
  // BASELINE: Intentional lack of HttpOnly to demonstrate cookie theft vulnerability (if applicable)
  // But actually, we want the implementation to work across both, just hardened has secure flags.
  // We'll set HttpOnly for both to make it functional, but Secure only in hardened.
  res.cookie('refreshToken', refreshTokenStr, {
    httpOnly: true,
    secure: !env.isBaseline(), // HTTPS only in hardened (though localhost ignores this sometimes)
    sameSite: env.isBaseline() ? 'lax' : 'strict', // Strict in hardened
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (env.isBaseline()) {
      // ---------------------------------------------------------------------
      // VULNERABILITY V-03: Weak input validation
      // No password strength check, no length limits, no type validation.
      // A user could register with password "1" or an extremely long name.
      // ---------------------------------------------------------------------
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }
    }
    // In hardened mode, validation is handled by express-validator middleware
    // before this controller is reached.

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (env.isBaseline()) {
        // Reveals that the email is already registered
        return res.status(409).json({ error: `User with email ${email} already exists.` });
      }
      // Hardened: generic message
      return res.status(409).json({ error: 'Registration failed. Please try a different email.' });
    }

    const user = new User({
      name,
      email,
      passwordHash: password // pre-save hook will hash it
    });

    await user.save();

    const { accessToken, refreshToken } = await generateTokens(user);
    setRefreshTokenCookie(res, refreshToken);

    logger.info(`User registered: ${user.email}`, { userId: user._id, requestId: req.requestId });

    res.status(201).json({
      message: 'Registration successful.',
      token: accessToken,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      if (env.isBaseline()) {
        // Reveals that the email is not registered
        return res.status(401).json({ error: `No account found with email: ${email}` });
      }
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (env.isBaseline()) {
        // Reveals that password is wrong (not the email)
        return res.status(401).json({ error: 'Incorrect password.' });
      }
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { accessToken, refreshToken } = await generateTokens(user);
    setRefreshTokenCookie(res, refreshToken);

    logger.info(`User logged in: ${user.email}`, { userId: user._id, requestId: req.requestId });

    res.json({
      message: 'Login successful.',
      token: accessToken,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/profile
async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/logout
async function logout(req, res, next) {
  try {
    const refreshTokenStr = req.cookies?.refreshToken;
    if (refreshTokenStr) {
      // Mark as revoked or delete from DB
      await RefreshToken.findOneAndDelete({ token: refreshTokenStr });
    }
    
    res.clearCookie('refreshToken');
    logger.info('User logged out', { userId: req.user?.id, requestId: req.requestId });
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/refresh
async function refreshToken(req, res, next) {
  try {
    const refreshTokenStr = req.cookies?.refreshToken;
    if (!refreshTokenStr) {
      return res.status(401).json({ error: 'Refresh token required.' });
    }

    // Verify JWT signature
    let decoded;
    try {
      decoded = jwt.verify(refreshTokenStr, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    // Check DB to ensure it's not revoked
    const storedToken = await RefreshToken.findOne({ token: refreshTokenStr });
    if (!storedToken || storedToken.revoked) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Token has been revoked or is invalid.' });
    }

    // Find user to ensure they still exist and get latest role
    const user = await User.findById(decoded.id);
    if (!user) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    // Issue new access token
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    const newAccessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
      algorithm: 'HS256'
    });

    res.json({ token: newAccessToken });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, getProfile, logout, refreshToken };
