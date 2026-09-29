// =============================================================================
// Admin Controller
// =============================================================================
// Handles: List users, Delete posts, Delete comments, Manage users
// Admin-only operations protected by role check in routes.
// =============================================================================

const User = require('../models/User');
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const logger = require('../utils/logger');

// GET /api/admin/users
async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-passwordHash -__v').sort({ createdAt: -1 });
    logger.info('Admin listed users', { adminId: req.user.id, requestId: req.requestId });
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/admin/posts/:id
async function adminDeletePost(req, res, next) {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Delete associated comments
    await Comment.deleteMany({ postId: post._id });
    await BlogPost.findByIdAndDelete(req.params.id);

    logger.info('Admin deleted post', {
      postId: req.params.id,
      adminId: req.user.id,
      requestId: req.requestId
    });

    res.json({ message: 'Post and associated comments deleted.' });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/admin/comments/:id
async function adminDeleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    await Comment.findByIdAndDelete(req.params.id);

    logger.info('Admin deleted comment', {
      commentId: req.params.id,
      adminId: req.user.id,
      requestId: req.requestId
    });

    res.json({ message: 'Comment deleted.' });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ error: 'Cannot delete an admin user.' });
    }

    // Delete user's posts and comments
    await Comment.deleteMany({ author: user._id });
    await BlogPost.deleteMany({ author: user._id });
    await User.findByIdAndDelete(req.params.id);

    logger.info('Admin deleted user', {
      deletedUserId: req.params.id,
      adminId: req.user.id,
      requestId: req.requestId
    });

    res.json({ message: 'User and associated content deleted.' });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/stats
async function getStats(req, res, next) {
  try {
    const [userCount, postCount, commentCount] = await Promise.all([
      User.countDocuments(),
      BlogPost.countDocuments(),
      Comment.countDocuments()
    ]);

    res.json({
      stats: {
        users: userCount,
        posts: postCount,
        comments: commentCount
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listUsers, adminDeletePost, adminDeleteComment, deleteUser, getStats };
