// =============================================================================
// Auth Routes
// =============================================================================
// POST /api/auth/register  — Register new user
// POST /api/auth/login     — Login
// POST /api/auth/logout    — Logout (requires auth)
// GET  /api/auth/profile   — Get current user profile (requires auth)
// =============================================================================

const express = require('express');
const router = express.Router();
const { register, login, logout, getProfile, refreshToken } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout); // Logout doesn't strictly need auth if they just have a cookie
router.post('/refresh', refreshToken);
router.get('/profile', authenticate, getProfile);

module.exports = router;
