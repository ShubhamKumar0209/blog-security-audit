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

router.get('/:postId', getComments);
router.post('/:postId', authenticate, createComment);
router.delete('/:commentId', authenticate, deleteComment);

module.exports = router;
