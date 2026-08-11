// =============================================================================
// Post Controller
// =============================================================================
// Handles: Create, Read, Update, Delete, Search blog posts
//
// SECURITY BASELINE (V-07 — Weak Authorization):
//   Update and delete operations do NOT check resource ownership.
//   Any authenticated user can modify/delete any post.
//   This demonstrates the difference between authentication ("who are you?")
//   and authorization ("are you allowed to do this?").
//
// HARDENED:
//   Ownership checks ensure users can only modify their own posts.
//   Admin override for moderation purposes.
// =============================================================================

const BlogPost = require('../models/BlogPost');
const env = require('../config/env');
const logger = require('../utils/logger');

// GET /api/posts
async function getPosts(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const posts = await BlogPost.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BlogPost.countDocuments();

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/posts/search?q=term
async function searchPosts(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const posts = await BlogPost.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .populate('author', 'name email')
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);

    res.json({ posts, query: q });
  } catch (error) {
    next(error);
  }
}

// GET /api/posts/:id
async function getPost(req, res, next) {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author', 'name email');
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    res.json({ post });
  } catch (error) {
    next(error);
  }
}

// POST /api/posts
async function createPost(req, res, next) {
  try {
    const { title, content } = req.body;

    if (env.isBaseline()) {
      // -------------------------------------------------------------------
      // VULNERABILITY V-03: Weak input validation
      // No length limits on title or content. No content validation.
      // -------------------------------------------------------------------
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required.' });
      }
    }

    const post = new BlogPost({
      title,
      content,
      author: req.user.id
    });

    await post.save();
    await post.populate('author', 'name email');

    logger.info('Post created', { postId: post._id, userId: req.user.id, requestId: req.requestId });

    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
}

// PUT /api/posts/:id
async function updatePost(req, res, next) {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (env.isHardened()) {
      // -------------------------------------------------------------------
      // HARDENED: Ownership check
      // Only the author or an admin can update this post.
      // -------------------------------------------------------------------
      if (post.author.toString() !== req.user.id && req.user.role !== 'ADMIN') {
        logger.warn('Unauthorized post update attempt', {
          postId: post._id,
          postAuthor: post.author,
          requestUserId: req.user.id,
          requestId: req.requestId
        });
        return res.status(403).json({ error: 'You do not have permission to edit this post.' });
      }
    }
    // BASELINE V-07: No ownership check — any authenticated user can update any post

    const { title, content } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;

    await post.save();
    await post.populate('author', 'name email');

    logger.info('Post updated', { postId: post._id, userId: req.user.id, requestId: req.requestId });

    res.json({ post });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/posts/:id
async function deletePost(req, res, next) {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (env.isHardened()) {
      // -------------------------------------------------------------------
      // HARDENED: Ownership check
      // Only the author or an admin can delete this post.
      // -------------------------------------------------------------------
      if (post.author.toString() !== req.user.id && req.user.role !== 'ADMIN') {
        logger.warn('Unauthorized post delete attempt', {
          postId: post._id,
          postAuthor: post.author,
          requestUserId: req.user.id,
          requestId: req.requestId
        });
        return res.status(403).json({ error: 'You do not have permission to delete this post.' });
      }
    }
    // BASELINE V-07: No ownership check — any authenticated user can delete any post

    await BlogPost.findByIdAndDelete(req.params.id);

    logger.info('Post deleted', { postId: req.params.id, userId: req.user.id, requestId: req.requestId });

    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPosts, getPost, searchPosts, createPost, updatePost, deletePost };
