// =============================================================================
// Comment Routes
// =============================================================================
// GET    /api/comments/:postId     — List comments for a post (public)
// POST   /api/comments/:postId     — Add comment (auth required)
// DELETE /api/comments/:commentId  — Delete comment (auth required)
// =============================================================================

const express = require('express');
const router = express.Router();
const { getComments, createComment, deleteComment } = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');
const { validate, validateObjectId } = require('../middleware/validate');

router.get('/:postId', validateObjectId('postId'), getComments);
router.post('/:postId', authenticate, validateObjectId('postId'), validate('createComment'), createComment);
router.delete('/:commentId', authenticate, validateObjectId('commentId'), deleteComment);

module.exports = router;
