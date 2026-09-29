// =============================================================================
// Comment Controller
// =============================================================================
// Handles: Create, List (by post), Delete comments
//
// SECURITY BASELINE (V-03, V-04):
//   - No input length limits on comment content
//   - Comment content stored as-is (no sanitization)
//   - This enables stored XSS if the frontend renders content unsafely
// =============================================================================

const Comment = require('../models/Comment');
const BlogPost = require('../models/BlogPost');
const env = require('../config/env');
const logger = require('../utils/logger');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// GET /api/comments/:postId
async function getComments(req, res, next) {
  try {
    const { postId } = req.params;

    const post = await BlogPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const comments = await Comment.find({ postId })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (error) {
    next(error);
  }
}

// POST /api/comments/:postId
async function createComment(req, res, next) {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    const post = await BlogPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (env.isBaseline()) {
      // -------------------------------------------------------------------
      // VULNERABILITY V-03: Weak input validation
      // No length limit on comment content. A user could submit megabytes.
      // VULNERABILITY V-04: No sanitization
      // Content like <script>alert("XSS")</script> is stored as-is.
      // -------------------------------------------------------------------
      if (!content) {
        return res.status(400).json({ error: 'Comment content is required.' });
      }
    }

    let contentToSave = content;
    if (env.isHardened()) {
      contentToSave = DOMPurify.sanitize(content);
    }

    const comment = new Comment({
      postId,
      author: req.user.id,
      content: contentToSave
    });

    await comment.save();
    await comment.populate('author', 'name email');

    logger.info('Comment created', {
      commentId: comment._id,
      postId,
      userId: req.user.id,
      requestId: req.requestId
    });

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/comments/:commentId
async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (env.isHardened()) {
      // Only comment author or admin can delete
      if (comment.author.toString() !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You do not have permission to delete this comment.' });
      }
    }
    // BASELINE V-07: Any authenticated user can delete any comment

    await Comment.findByIdAndDelete(req.params.commentId);

    logger.info('Comment deleted', {
      commentId: req.params.commentId,
      userId: req.user.id,
      requestId: req.requestId
    });

    res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getComments, createComment, deleteComment };
