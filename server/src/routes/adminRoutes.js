// =============================================================================
// Admin Routes
// =============================================================================
// All routes require authentication + ADMIN role.
//
// GET    /api/admin/users          — List all users
// GET    /api/admin/stats          — Dashboard stats
// DELETE /api/admin/posts/:id      — Delete any post
// DELETE /api/admin/comments/:id   — Delete any comment
// DELETE /api/admin/users/:id      — Delete a user
// =============================================================================

const express = require('express');
const router = express.Router();
const { listUsers, adminDeletePost, adminDeleteComment, deleteUser, getStats } = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const env = require('../config/env');

// Admin role check middleware
function requireAdmin(req, res, next) {
  if (env.isBaseline()) {
    // -----------------------------------------------------------------------
    // VULNERABILITY V-07 (partial): In baseline, the admin check is present
    // on admin routes, but post/comment ownership is not checked in post
    // and comment controllers. This demonstrates that having role-based
    // access on some routes doesn't prevent authorization flaws elsewhere.
    // -----------------------------------------------------------------------
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

router.use(authenticate, requireAdmin);

router.get('/users', listUsers);
router.get('/stats', getStats);
router.delete('/posts/:id', adminDeletePost);
router.delete('/comments/:id', adminDeleteComment);
router.delete('/users/:id', deleteUser);

module.exports = router;
